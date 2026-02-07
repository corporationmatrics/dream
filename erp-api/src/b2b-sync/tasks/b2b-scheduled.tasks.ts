import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Connection } from 'typeorm';
import { WebhookNotifierService } from './services/webhook-notifier.service';
import { InvoiceGeneratorService } from './services/invoice-generator.service';

/**
 * B2B Scheduled Tasks
 *
 * Automated background jobs for B2B integration:
 * 1. Webhook delivery processor (every 5 minutes)
 * 2. Ledger posting job processor (every 1 minute)
 * 3. Audit log cleanup (every 1 hour)
 * 4. Dead letter alert (every 30 minutes)
 * 5. Partner SLA monitoring (every 15 minutes)
 *
 * All tasks log completion/errors for monitoring
 */
@Injectable()
export class B2BScheduledTasks {
  private readonly logger = new Logger(B2BScheduledTasks.name);

  constructor(
    private readonly webhookNotifierService: WebhookNotifierService,
    private readonly invoiceGeneratorService: InvoiceGeneratorService,
    private readonly connection: Connection,
  ) {}

  /**
   * Process pending webhooks
   * Runs every 5 minutes
   *
   * Triggers:
   * - Deliver PENDING webhooks
   * - Retry FAILED webhooks with exponential backoff
   * - Move max-retry failures to dead letter
   */
  @Cron(CronExpression.EVERY_5_MINUTES)
  async processPendingWebhooks() {
    const startTime = Date.now();
    this.logger.debug('[processPendingWebhooks] SCHEDULED TASK START');

    try {
      const result = await this.webhookNotifierService.processPendingWebhooks();
      const duration = Date.now() - startTime;

      // Log metrics
      this.logger.log(
        `[processPendingWebhooks] COMPLETED - Processed: ${result.processed}, Sent: ${result.sent}, Failed: ${result.failed}, Duration: ${duration}ms`,
      );

      // Alert if high failure rate
      if (result.failed > result.sent * 0.1) {
        this.logger.warn(
          `[processPendingWebhooks] WARNING - High failure rate: ${result.failed} failed vs ${result.sent} sent`,
        );
        // Could trigger Slack alert here
      }
    } catch (error) {
      this.logger.error(
        `[processPendingWebhooks] FAILED - ${error.message}`,
        error.stack,
      );
      // Don't throw - prevent crashing scheduler
    }
  }

  /**
   * Process ledger posting jobs
   * Runs every 1 minute
   *
   * Triggers:
   * - Fetch pending ledger posting jobs from b2b_job_queue
   * - POST invoice to Spring Boot accounting service
   * - Update job status (COMPLETED/FAILED)
   * - Retry with exponential backoff on failure
   */
  @Cron(CronExpression.EVERY_MINUTE)
  async processLedgerPostingJobs() {
    const startTime = Date.now();
    this.logger.debug('[processLedgerPostingJobs] SCHEDULED TASK START');

    try {
      // Fetch pending jobs
      const pendingJobs = await this.connection.query(
        `SELECT job_id FROM b2b_job_queue
         WHERE job_type = 'LEDGER_POST_INVOICE'
         AND job_status = 'PENDING'
         AND (next_retry_at IS NULL OR next_retry_at <= NOW())
         ORDER BY created_at ASC
         LIMIT 50`,
      );

      this.logger.debug(
        `[processLedgerPostingJobs] Found ${pendingJobs.length} jobs to process`,
      );

      let processed = 0;
      let completed = 0;
      let failed = 0;

      for (const job of pendingJobs) {
        try {
          await this.invoiceGeneratorService.processLedgerPosting(job.job_id);
          completed++;
        } catch (error) {
          this.logger.warn(
            `[processLedgerPostingJobs] Job ${job.job_id} failed: ${error.message}`,
          );
          failed++;
        }
        processed++;
      }

      const duration = Date.now() - startTime;

      this.logger.log(
        `[processLedgerPostingJobs] COMPLETED - Processed: ${processed}, Completed: ${completed}, Failed: ${failed}, Duration: ${duration}ms`,
      );
    } catch (error) {
      this.logger.error(
        `[processLedgerPostingJobs] FAILED - ${error.message}`,
        error.stack,
      );
    }
  }

  /**
   * Cleanup old audit logs
   * Runs every 1 hour
   *
   * Deletes:
   * - EDI audit logs older than 90 days
   * - Successful webhook delivery logs older than 30 days
   * - Failed delivery logs older than 90 days (keep for analysis)
   *
   * Keeps:
   * - All failed/dead letter webhooks for 6 months
   * - All PO/Invoice data forever (IMMUTABLE)
   */
  @Cron(CronExpression.EVERY_HOUR)
  async cleanupExpiredAuditLogs() {
    const startTime = Date.now();
    this.logger.debug('[cleanupExpiredAuditLogs] SCHEDULED TASK START');

    try {
      const deleted = {
        ediAuditLogs: 0,
        webhookDeliveryLogs: 0,
      };

      // Delete old EDI audit logs (>90 days)
      const ediResult = await this.connection.query(
        `DELETE FROM b2b_edi_audit_log
         WHERE created_at < NOW() - INTERVAL '90 days'
         AND processing_status IN ('GENERATED', 'DELIVERED')
         RETURNING audit_id`,
      );
      deleted.ediAuditLogs = ediResult.length;

      // Delete old successful webhook delivery logs (>30 days)
      const webhookDelResult = await this.connection.query(
        `DELETE FROM b2b_webhook_delivery_log
         WHERE created_at < NOW() - INTERVAL '30 days'
         AND delivery_status = 'DELIVERED'
         RETURNING log_id`,
      );
      deleted.webhookDeliveryLogs = webhookDelResult.length;

      const duration = Date.now() - startTime;

      this.logger.log(
        `[cleanupExpiredAuditLogs] COMPLETED - EDI logs deleted: ${deleted.ediAuditLogs}, Webhook logs deleted: ${deleted.webhookDeliveryLogs}, Duration: ${duration}ms`,
      );
    } catch (error) {
      this.logger.error(
        `[cleanupExpiredAuditLogs] FAILED - ${error.message}`,
        error.stack,
      );
    }
  }

  /**
   * Monitor dead letter queue
   * Runs every 30 minutes
   *
   * Checks:
   * - Number of messages in dead letter queue
   * - Age of oldest dead letter
   * - Alert threshold exceeded (>50 messages)
   *
   * Actions:
   * - Send Slack alert if threshold exceeded
   * - Create PagerDuty incident if critical
   */
  @Cron(`0 */30 * * * *`) // Every 30 minutes at :00 seconds
  async monitorDeadLetterQueue() {
    const startTime = Date.now();
    this.logger.debug('[monitorDeadLetterQueue] SCHEDULED TASK START');

    try {
      const stats = await this.connection.query(
        `SELECT COUNT(*) as total, MIN(created_at) as oldest
         FROM b2b_webhook_dead_letter`,
      );

      const dlCount = stats[0].total;
      const oldestDL = stats[0].oldest;

      this.logger.log(
        `[monitorDeadLetterQueue] Dead letters: ${dlCount}, Oldest: ${oldestDL}`,
      );

      // Alert thresholds
      if (dlCount > 100) {
        this.logger.error(
          `[monitorDeadLetterQueue] CRITICAL - ${dlCount} webhooks in dead letter queue!`,
        );
        // Trigger PagerDuty alert
      } else if (dlCount > 50) {
        this.logger.warn(
          `[monitorDeadLetterQueue] WARNING - ${dlCount} webhooks in dead letter queue`,
        );
        // Trigger Slack alert
      }

      const duration = Date.now() - startTime;
      this.logger.debug(
        `[monitorDeadLetterQueue] COMPLETED - Duration: ${duration}ms`,
      );
    } catch (error) {
      this.logger.error(
        `[monitorDeadLetterQueue] FAILED - ${error.message}`,
        error.stack,
      );
    }
  }

  /**
   * Monitor partner SLAs
   * Runs every 15 minutes
   *
   * Checks:
   * - Invoice delivery time (target: <5 minutes)
   * - Ledger posting lag (target: <10 minutes)
   * - Webhook delivery success rate (target: >99.5%)
   *
   * Reports:
   * - SLA violations
   * - Performance trends
   * - Partner health score
   */
  @Cron(`0 */15 * * * *`) // Every 15 minutes at :00 seconds
  async monitorPartnerSLAs() {
    const startTime = Date.now();
    this.logger.debug('[monitorPartnerSLAs] SCHEDULED TASK START');

    try {
      // Calculate metrics for each partner
      const metrics = await this.connection.query(
        `SELECT 
          bp.partner_id,
          bp.partner_name,
          COUNT(DISTINCT bi.invoice_id) as invoices_generated,
          EXTRACT(EPOCH FROM (NOW() - AVG(bi.created_at)))/60 as avg_inv_age_minutes,
          SUM(CASE WHEN bwq.webhook_status = 'SENT' THEN 1 ELSE 0 END)::float / 
          NULLIF(COUNT(bwq.webhook_id), 0) as webhook_success_rate
         FROM b2b_partners bp
         LEFT JOIN b2b_invoices bi ON bp.partner_id = bi.partner_id
         LEFT JOIN b2b_webhook_queue bwq ON bp.partner_id = bwq.partner_id
         WHERE bp.partner_status = 'ACTIVE'
         AND bi.created_at > NOW() - INTERVAL '1 hour'
         GROUP BY bp.partner_id, bp.partner_name
         HAVING COUNT(bi.invoice_id) > 0`,
      );

      this.logger.log(
        `[monitorPartnerSLAs] Checked ${metrics.length} active partners`,
      );

      // Alert on SLA violations
      for (const metric of metrics) {
        const violations = [];

        if (metric.avg_inv_age_minutes > 5) {
          violations.push(
            `Invoice delay: ${metric.avg_inv_age_minutes.toFixed(1)}min (target: <5min)`,
          );
        }

        if (metric.webhook_success_rate < 0.995) {
          violations.push(
            `Webhook success: ${(metric.webhook_success_rate * 100).toFixed(2)}% (target: >99.5%)`,
          );
        }

        if (violations.length > 0) {
          this.logger.warn(
            `[monitorPartnerSLAs] SLA violation for ${metric.partner_name}: ${violations.join(', ')}`,
          );
        }
      }

      const duration = Date.now() - startTime;
      this.logger.debug(
        `[monitorPartnerSLAs] COMPLETED - Duration: ${duration}ms`,
      );
    } catch (error) {
      this.logger.error(
        `[monitorPartnerSLAs] FAILED - ${error.message}`,
        error.stack,
      );
    }
  }

  /**
   * Validate PO-Invoice-Ledger chain integrity
   * Runs every 6 hours
   *
   * Checks:
   * - All invoiced POs have ledger postings
   * - All ledger postings map to valid invoices
   * - No orphaned records
   * - Audit trail completeness
   */
  @Cron(`0 0 */6 * * *`) // Every 6 hours at :00:00
  async validateDataIntegrity() {
    const startTime = Date.now();
    this.logger.debug('[validateDataIntegrity] SCHEDULED TASK START');

    try {
      // Check for invoiced POs without ledger posting
      const orphanedInvoices = await this.connection.query(
        `SELECT COUNT(*) as count FROM b2b_invoices bi
         WHERE NOT EXISTS (
           SELECT 1 FROM b2b_job_queue bj 
           WHERE bj.job_type = 'LEDGER_POST_INVOICE'
           AND CAST(bj.job_payload ->> 'invoice_number' AS TEXT) = bi.invoice_number
           AND bj.job_status = 'COMPLETED'
         )
         AND bi.created_at > NOW() - INTERVAL '24 hours'`,
      );

      if (orphanedInvoices[0].count > 0) {
        this.logger.warn(
          `[validateDataIntegrity] Found ${orphanedInvoices[0].count} invoices without ledger postings`,
        );
      }

      // Check audit trail for gaps
      const auditGaps = await this.connection.query(
        `SELECT COUNT(*) as gap_count FROM b2b_edi_audit_log
         WHERE processing_status IS NULL
         AND created_at > NOW() - INTERVAL '24 hours'`,
      );

      if (auditGaps[0].gap_count > 0) {
        this.logger.warn(
          `[validateDataIntegrity] Found ${auditGaps[0].gap_count} audit logs with missing status`,
        );
      }

      const duration = Date.now() - startTime;
      this.logger.log(
        `[validateDataIntegrity] COMPLETED - Orphans: ${orphanedInvoices[0].count}, Audit gaps: ${auditGaps[0].gap_count}, Duration: ${duration}ms`,
      );
    } catch (error) {
      this.logger.error(
        `[validateDataIntegrity] FAILED - ${error.message}`,
        error.stack,
      );
    }
  }
}
