import {
  Injectable,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Connection } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import axios, { AxiosInstance } from 'axios';

interface WebhookQueueRecord {
  webhook_id: string;
  partner_id: string;
  message_type: string;
  message_id: string;
  message_payload: Record<string, any>;
  webhook_url: string;
  auth_token: string;
  retry_count: number;
  next_retry_at: Date;
  webhook_status: 'PENDING' | 'SENT' | 'FAILED' | 'DEAD_LETTER';
  created_at: Date;
}

interface WebhookDeliveryResult {
  webhook_id: string;
  delivery_status: 'SENT' | 'FAILED';
  http_status_code?: number;
  error_message?: string;
  retry_count: number;
  delivered_at?: Date;
  next_retry_at?: Date;
}

@Injectable()
export class WebhookNotifierService {
  private readonly logger = new Logger(WebhookNotifierService.name);
  private readonly httpClient: AxiosInstance;

  constructor(
    @InjectRepository('B2BWebhookQueue')
    private readonly webhookQueueRepository: Repository<any>,
    @InjectRepository('B2BEDIAuditLog')
    private readonly auditLogRepository: Repository<any>,
    private readonly connection: Connection,
  ) {
    // Configure HTTP client with retry/timeout
    this.httpClient = axios.create({
      timeout: 30000, // 30 second timeout
      maxRedirects: 5,
      validateStatus: (status) => status < 500, // Don't throw on 4xx (partner config issue)
    });

    // Add response interceptor for logging
    this.httpClient.interceptors.response.use(
      (response) => {
        this.logger.debug(
          `[HTTP] ${response.config.method?.toUpperCase()} ${response.config.url} => ${response.status}`,
        );
        return response;
      },
      (error) => {
        this.logger.error(
          `[HTTP] Error: ${error.code} ${error.message}`,
        );
        return Promise.reject(error);
      },
    );
  }

  /**
   * Process pending webhooks from queue
   * Called by scheduled job worker every 5 minutes
   *
   * Retry Strategy:
   * - Retry 1: 5 minutes (300s)
   * - Retry 2: 30 minutes (1800s)
   * - Retry 3: 2 hours (7200s)
   * - Retry 4: 6 hours (21600s)
   * - Retry 5: DEAD_LETTER
   */
  async processPendingWebhooks(): Promise<{ processed: number; sent: number; failed: number }> {
    this.logger.debug('[processPendingWebhooks] START');

    const stats = {
      processed: 0,
      sent: 0,
      failed: 0,
    };

    try {
      // Fetch all webhooks ready for delivery
      const pendingWebhooks = await this.webhookQueueRepository.query(
        `SELECT * FROM b2b_webhook_queue
         WHERE webhook_status IN ('PENDING', 'FAILED')
         AND next_retry_at <= NOW()
         AND retry_count < 5
         ORDER BY created_at ASC
         LIMIT 100`,
      );

      this.logger.info(
        `[processPendingWebhooks] Found ${pendingWebhooks.length} webhooks to process`,
      );

      for (const webhook of pendingWebhooks) {
        const result = await this.deliverWebhook(webhook);
        stats.processed++;

        if (result.delivery_status === 'SENT') {
          stats.sent++;
        } else {
          stats.failed++;
        }
      }

      // Move dead letters to audit log
      const deadLetters = await this.webhookQueueRepository.query(
        `SELECT * FROM b2b_webhook_queue
         WHERE webhook_status = 'FAILED'
         AND retry_count >= 5`,
      );

      for (const deadLetter of deadLetters) {
        await this.moveToDead Letter(deadLetter);
      }

      this.logger.info(
        `[processPendingWebhooks] DONE - Processed: ${stats.processed}, Sent: ${stats.sent}, Failed: ${stats.failed}`,
      );

      return stats;
    } catch (error) {
      this.logger.error(
        `[processPendingWebhooks] Fatal error: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Deliver single webhook with retry & backoff
   */
  private async deliverWebhook(webhook: WebhookQueueRecord): Promise<WebhookDeliveryResult> {
    const { webhook_id, webhook_url, auth_token, message_payload, partner_id } = webhook;

    try {
      this.logger.debug(`[deliverWebhook] START - Webhook: ${webhook_id}, URL: ${webhook_url}`);

      // Add authorization header
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'X-Message-ID': message_payload.message_id,
        'X-Dream-Signature': this.generateSignature(message_payload, auth_token),
      };

      // Add auth token if Bearer token format
      if (auth_token && auth_token.toLowerCase().startsWith('bearer ')) {
        headers['Authorization'] = auth_token;
      } else if (auth_token) {
        headers['Authorization'] = `Bearer ${auth_token}`;
      }

      // Attempt delivery
      const response = await this.httpClient.post(
        webhook_url,
        message_payload,
        { headers },
      );

      // Check if delivery was successful (2xx or 202 Accepted)
      if (response.status >= 200 && response.status < 300) {
        this.logger.info(
          `[deliverWebhook] SUCCESS - Webhook: ${webhook_id}, Status: ${response.status}`,
        );

        // Mark as SENT
        await this.webhookQueueRepository.query(
          `UPDATE b2b_webhook_queue
           SET webhook_status = 'SENT', attempt_count = attempt_count + 1, 
               delivered_at = NOW(), updated_at = NOW()
           WHERE webhook_id = $1`,
          [webhook_id],
        );

        // Audit log
        await this.auditLogRepository.query(
          `INSERT INTO b2b_webhook_delivery_log 
          (log_id, webhook_id, partner_id, http_status, response_payload, 
           delivery_status, delivered_at, created_at)
          VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())`,
          [
            uuidv4(),
            webhook_id,
            partner_id,
            response.status,
            JSON.stringify(response.data),
            'DELIVERED',
          ],
        );

        return {
          webhook_id,
          delivery_status: 'SENT',
          http_status_code: response.status,
          retry_count: webhook.retry_count,
        };
      } else {
        // 4xx errors indicate partner side issue - move to dead letter
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      this.logger.warn(
        `[deliverWebhook] FAILED - Webhook: ${webhook_id}, Error: ${error.message}`,
      );

      const nextRetryAt = this.calculateNextRetry(webhook.retry_count);
      const newRetryCount = webhook.retry_count + 1;
      const newStatus = newRetryCount >= 5 ? 'FAILED' : 'PENDING';

      // Update webhook queue with retry info
      await this.webhookQueueRepository.query(
        `UPDATE b2b_webhook_queue
         SET webhook_status = $1, retry_count = $2, next_retry_at = $3, 
             last_error_message = $4, updated_at = NOW()
         WHERE webhook_id = $5`,
        [newStatus, newRetryCount, nextRetryAt, error.message, webhook_id],
      );

      // Audit log failure
      await this.auditLogRepository.query(
        `INSERT INTO b2b_webhook_delivery_log 
        (log_id, webhook_id, partner_id, http_status, error_message, 
         delivery_status, created_at)
        VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
        [
          uuidv4(),
          webhook_id,
          partner_id,
          error.response?.status || 0,
          error.message,
          'FAILED',
        ],
      );

      return {
        webhook_id,
        delivery_status: 'FAILED',
        http_status_code: error.response?.status,
        error_message: error.message,
        retry_count: newRetryCount,
        next_retry_at: nextRetryAt,
      };
    }
  }

  /**
   * Calculate next retry time with exponential backoff
   *
   * Retry Schedule:
   * - Attempt 0: Immediate (< 5s)
   * - Attempt 1: +5 min
   * - Attempt 2: +30 min
   * - Attempt 3: +2 hours
   * - Attempt 4: +6 hours
   * - Attempt 5: DEAD_LETTER
   */
  private calculateNextRetry(currentRetryCount: number): Date {
    const backofSeconds = {
      0: 300,        // 5 minutes
      1: 1800,       // 30 minutes
      2: 7200,       // 2 hours
      3: 21600,      // 6 hours
      4: 86400,      // 24 hours (last attempt)
    };

    const delaySeconds = backofSeconds[currentRetryCount] || 86400;
    return new Date(Date.now() + delaySeconds * 1000);
  }

  /**
   * Move failed webhooks to dead letter queue
   * These require manual intervention from ops team
   */
  private async moveToDead Letter(webhook: WebhookQueueRecord): Promise<void> {
    const { webhook_id, partner_id, message_type, message_payload } = webhook;

    this.logger.warn(
      `[moveToDeadLetter] Moving webhook ${webhook_id} to dead letter after 5 retries`,
    );

    // Update status
    await this.webhookQueueRepository.query(
      `UPDATE b2b_webhook_queue
       SET webhook_status = 'DEAD_LETTER', updated_at = NOW()
       WHERE webhook_id = $1`,
      [webhook_id],
    );

    // Insert into dead letter table for manual review
    await this.connection.query(
      `INSERT INTO b2b_webhook_dead_letter 
      (dlq_id, webhook_id, partner_id, message_type, message_payload, 
       reason, created_at)
      VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
      [
        uuidv4(),
        webhook_id,
        partner_id,
        message_type,
        JSON.stringify(message_payload),
        'Max retries exceeded',
      ],
    );

    // Alert ops team (send to Slack, email, etc)
    this.logger.error(
      `[moveToDeadLetter] ALERT: Dead letter for partner ${partner_id}, message ${message_type}`,
    );
  }

  /**
   * Manually retry a dead letter webhook
   * Called by ops team via admin API
   */
  async retryDeadLetter(webhookId: string, userId: string): Promise<void> {
    try {
      // Fetch from dead letter
      const dlResult = await this.connection.query(
        `SELECT * FROM b2b_webhook_dead_letter WHERE webhook_id = $1`,
        [webhookId],
      );

      if (!dlResult || dlResult.length === 0) {
        throw new BadRequestException(`Webhook not in dead letter: ${webhookId}`);
      }

      const deadLetter = dlResult[0];

      // Reset webhook for retry
      await this.webhookQueueRepository.query(
        `UPDATE b2b_webhook_queue
         SET webhook_status = 'PENDING', retry_count = 0, next_retry_at = NOW(),
             last_error_message = NULL, updated_at = NOW()
         WHERE webhook_id = $1`,
        [webhookId],
      );

      // Log manual retry
      await this.auditLogRepository.query(
        `INSERT INTO b2b_webhook_manual_retry_log 
        (retry_id, webhook_id, partner_id, retried_by, reason, created_at)
        VALUES ($1, $2, $3, $4, $5, NOW())`,
        [
          uuidv4(),
          webhookId,
          deadLetter.partner_id,
          userId,
          'Manual retry from dead letter',
        ],
      );

      // Remove from dead letter
      await this.connection.query(
        `DELETE FROM b2b_webhook_dead_letter WHERE webhook_id = $1`,
        [webhookId],
      );

      this.logger.info(
        `[retryDeadLetter] Retry initiated by ${userId} for webhook ${webhookId}`,
      );
    } catch (error) {
      this.logger.error(
        `[retryDeadLetter] Failed: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Get webhook delivery history
   */
  async getWebhookHistory(
    partnerId: string,
    limit: number = 100,
    offset: number = 0,
  ): Promise<{ total: number; webhooks: any[] }> {
    const countResult = await this.connection.query(
      `SELECT COUNT(*) as total FROM b2b_webhook_queue WHERE partner_id = $1`,
      [partnerId],
    );

    const total = countResult[0].total;

    const webhooks = await this.connection.query(
      `SELECT webhook_id, message_type, webhook_status, retry_count, 
              created_at, delivered_at, last_error_message
       FROM b2b_webhook_queue
       WHERE partner_id = $1
       ORDER BY created_at DESC
       LIMIT $2 OFFSET $3`,
      [partnerId, limit, offset],
    );

    return { total, webhooks };
  }

  /**
   * Get webhook delivery logs (detailed history)
   */
  async getDeliveryLogs(
    webhookId: string,
  ): Promise<any[]> {
    return this.connection.query(
      `SELECT log_id, webhook_id, http_status, delivery_status, 
              error_message, delivered_at, created_at
       FROM b2b_webhook_delivery_log
       WHERE webhook_id = $1
       ORDER BY created_at DESC`,
      [webhookId],
    );
  }

  /**
   * Generate HMAC signature for webhook payload
   * Allows partner to verify message authenticity
   */
  private generateSignature(payload: any, sharedSecret: string): string {
    const crypto = require('crypto');
    const payloadString = JSON.stringify(payload);

    return crypto
      .createHmac('sha256', sharedSecret)
      .update(payloadString)
      .digest('hex');
  }

  /**
   * Verify webhook signature on partner request
   * (used if partners POST back to us)
   */
  verifyWebhookSignature(
    payload: any,
    signature: string,
    sharedSecret: string,
  ): boolean {
    const expectedSignature = this.generateSignature(payload, sharedSecret);
    return signature === expectedSignature;
  }

  /**
   * Get webhook queue statistics
   */
  async getQueueStats(): Promise<{
    pending: number;
    sent: number;
    failed: number;
    deadLetter: number;
    avgRetries: number;
  }> {
    const result = await this.connection.query(
      `SELECT 
        SUM(CASE WHEN webhook_status = 'PENDING' THEN 1 ELSE 0 END) as pending,
        SUM(CASE WHEN webhook_status = 'SENT' THEN 1 ELSE 0 END) as sent,
        SUM(CASE WHEN webhook_status = 'FAILED' THEN 1 ELSE 0 END) as failed,
        SUM(CASE WHEN webhook_status = 'DEAD_LETTER' THEN 1 ELSE 0 END) as dead_letter,
        ROUND(AVG(retry_count)::numeric, 2) as avg_retries
       FROM b2b_webhook_queue`,
    );

    return {
      pending: parseInt(result[0].pending) || 0,
      sent: parseInt(result[0].sent) || 0,
      failed: parseInt(result[0].failed) || 0,
      deadLetter: parseInt(result[0].dead_letter) || 0,
      avgRetries: parseFloat(result[0].avg_retries) || 0,
    };
  }
}
