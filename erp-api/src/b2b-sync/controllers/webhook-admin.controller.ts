import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  UseGuards,
  UseFilters,
  Logger,
  HttpCode,
  HttpStatus,
  Req,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { WebhookNotifierService } from '../services/webhook-notifier.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ClientIP } from '../../common/decorators/client-ip.decorator';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { B2BExceptionFilter } from '../filters/b2b-exception.filter';

/**
 * Webhook Admin Controller
 *
 * Operations API for B2B webhook management:
 * - View webhook queue statistics
 * - Retry dead letter webhooks
 * - View delivery history and logs
 *
 * Requires:
 * - JWT Bearer token with 'b2b:webhook:admin' role
 * - Only accessible to operations team
 */
@ApiTags('B2B Webhooks - Admin')
@Controller('b2b/webhooks')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('b2b:webhook:admin', 'admin')
@UseFilters(B2BExceptionFilter)
@ApiBearerAuth()
export class WebhookAdminController {
  private readonly logger = new Logger(WebhookAdminController.name);

  constructor(private readonly webhookNotifierService: WebhookNotifierService) {}

  /**
   * GET /api/b2b/webhooks/stats
   * Get webhook queue statistics
   *
   * Response:
   * {
   *   "pending": 45,
   *   "sent": 12350,
   *   "failed": 23,
   *   "dead_letter": 12,
   *   "avg_retries": 0.78,
   *   "queue_health": "HEALTHY",
   *   "oldest_pending": "2025-02-07T08:30:00Z",
   *   "last_updated": "2025-02-07T12:34:56Z"
   * }
   */
  @Get('stats')
  @ApiOperation({
    summary: 'Get Webhook Queue Stats',
    description: 'View webhook delivery queue health metrics',
  })
  @ApiResponse({
    status: 200,
    description: 'Queue statistics',
    schema: {
      type: 'object',
      properties: {
        pending: { type: 'number', description: 'Webhooks pending delivery' },
        sent: { type: 'number', description: 'Successfully delivered webhooks' },
        failed: { type: 'number', description: 'Failed after retries' },
        dead_letter: { type: 'number', description: 'Webhooks in dead letter queue' },
        avg_retries: { type: 'number', description: 'Average retry attempts' },
        queue_health: { type: 'string', enum: ['HEALTHY', 'WARNING', 'CRITICAL'] },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - insufficient privileges',
  })
  async getQueueStats() {
    this.logger.log('[getQueueStats] START');

    try {
      const stats = await this.webhookNotifierService.getQueueStats();

      // Determine health status
      let queueHealth = 'HEALTHY';
      if (stats.deadLetter > 50) {
        queueHealth = 'CRITICAL';
      } else if (stats.deadLetter > 10 || stats.failed > 100) {
        queueHealth = 'WARNING';
      }

      this.logger.log(
        `[getQueueStats] SUCCESS - Health: ${queueHealth}, Pending: ${stats.pending}`,
      );

      return {
        pending: stats.pending,
        sent: stats.sent,
        failed: stats.failed,
        dead_letter: stats.deadLetter,
        avg_retries: stats.avgRetries,
        queue_health: queueHealth,
        last_updated: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error(
        `[getQueueStats] FAILED - ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * GET /api/b2b/webhooks/dead-letters
   * List webhooks in dead letter queue
   *
   * Query Parameters:
   * - limit (optional, default=50): Records per page
   * - offset (optional, default=0): Page offset
   *
   * Response:
   * {
   *   "total": 12,
   *   "dead_letters": [
   *     {
   *       "webhook_id": "uuid",
   *       "partner_id": "VENDOR-456",
   *       "message_type": "purchase_order",
   *       "message_id": "PO-2025-00123-xyz",
   *       "reason": "Max retries exceeded",
   *       "created_at": "2025-02-06T10:00:00Z",
   *       "webhook_url": "https://vendor.com/edi/webhook",
   *       "last_error": "Connection timeout after 30s"
   *     }
   *   ]
   * }
   */
  @Get('dead-letters')
  @ApiOperation({
    summary: 'List Dead Letter Webhooks',
    description: 'View webhooks that failed after max retries and require manual intervention',
  })
  @ApiResponse({
    status: 200,
    description: 'Dead letter list',
    schema: {
      type: 'object',
      properties: {
        total: { type: 'number' },
        dead_letters: {
          type: 'array',
          items: { type: 'object' },
        },
      },
    },
  })
  async listDeadLetters(
    @Req() req: any,
  ) {
    this.logger.log('[listDeadLetters] START');

    try {
      // This would be implemented with actual dead letter query
      // For now, return stub
      const limit = req.query.limit || 50;
      const offset = req.query.offset || 0;

      this.logger.log(
        `[listDeadLetters] SUCCESS - Limit: ${limit}, Offset: ${offset}`,
      );

      return {
        total: 0,
        dead_letters: [],
      };
    } catch (error) {
      this.logger.error(
        `[listDeadLetters] FAILED - ${error.message}`,
      );
      throw error;
    }
  }

  /**
   * POST /api/b2b/webhooks/{webhookId}/retry
   * Manually retry a dead letter webhook
   *
   * Request body:
   * {
   *   "reason": "Partner fixed their endpoint issues"
   * }
   *
   * Response (200 OK):
   * {
   *   "webhook_id": "uuid",
   *   "status": "RETRYING",
   *   "message": "Webhook moved back to retry queue",
   *   "next_attempt": "2025-02-07T12:35:00Z"
   * }
   */
  @Post(':webhookId/retry')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Retry Dead Letter Webhook',
    description: 'Move webhook from dead letter back to retry queue for manual retry',
  })
  @ApiParam({
    name: 'webhookId',
    type: 'string',
    description: 'Webhook ID (UUID)',
  })
  @ApiResponse({
    status: 200,
    description: 'Retry initiated',
    schema: {
      type: 'object',
      properties: {
        webhook_id: { type: 'string' },
        status: { type: 'string', enum: ['RETRYING'] },
        next_attempt: { type: 'string' },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Webhook not found in dead letter queue',
  })
  async retryWebhook(
    @Param('webhookId') webhookId: string,
    @Body() body: { reason?: string },
    @CurrentUser() user: any,
  ) {
    this.logger.log(
      `[retryWebhook] START - WebhookId: ${webhookId}, User: ${user.id}, Reason: ${body.reason || 'Not provided'}`,
    );

    try {
      await this.webhookNotifierService.retryDeadLetter(
        webhookId,
        user.id,
      );

      this.logger.log(
        `[retryWebhook] SUCCESS - Webhook ${webhookId} moved to retry queue`,
      );

      return {
        webhook_id: webhookId,
        status: 'RETRYING',
        message: 'Webhook moved back to retry queue',
        next_attempt: new Date(Date.now() + 60000).toISOString(), // Retry in 1 minute
        initiated_by: user.email,
      };
    } catch (error) {
      this.logger.error(
        `[retryWebhook] FAILED - ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * GET /api/b2b/webhooks/{webhookId}/history
   * Get detailed delivery history for a webhook
   *
   * Response:
   * {
   *   "webhook_id": "uuid",
   *   "partner_id": "VENDOR-456",
   *   "message_type": "invoice",
   *   "webhook_url": "https://vendor.com/edi/webhook",
   *   "total_attempts": 5,
   *   "current_status": "FAILED",
   *   "delivery_logs": [
   *     {
   *       "log_id": "uuid",
   *       "attempt_number": 1,
   *       "http_status": 500,
   *       "delivery_status": "FAILED",
   *       "error_message": "Internal Server Error",
   *       "attempt_at": "2025-02-07T08:00:00Z"
   *     },
   *     {
   *       "log_id": "uuid",
   *       "attempt_number": 2,
   *       "http_status": 503,
   *       "delivery_status": "FAILED",
   *       "error_message": "Service Unavailable",
   *       "attempt_at": "2025-02-07T08:05:00Z"
   *     }
   *   ]
   * }
   */
  @Get(':webhookId/history')
  @ApiOperation({
    summary: 'Get Webhook Delivery History',
    description: 'View all delivery attempts and errors for a webhook',
  })
  @ApiParam({
    name: 'webhookId',
    type: 'string',
  })
  @ApiResponse({
    status: 200,
    description: 'Delivery history',
    schema: {
      type: 'object',
      properties: {
        webhook_id: { type: 'string' },
        total_attempts: { type: 'number' },
        delivery_logs: {
          type: 'array',
          items: { type: 'object' },
        },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Webhook not found',
  })
  async getWebhookHistory(
    @Param('webhookId') webhookId: string,
  ) {
    this.logger.log(
      `[getWebhookHistory] START - WebhookId: ${webhookId}`,
    );

    try {
      const logs = await this.webhookNotifierService.getDeliveryLogs(
        webhookId,
      );

      this.logger.log(
        `[getWebhookHistory] SUCCESS - Found ${logs.length} delivery attempts`,
      );

      return {
        webhook_id: webhookId,
        total_attempts: logs.length,
        delivery_logs: logs,
      };
    } catch (error) {
      this.logger.error(
        `[getWebhookHistory] FAILED - ${error.message}`,
      );
      throw error;
    }
  }

  /**
   * GET /api/b2b/webhooks/{partnerId}/queue-history
   * Get webhook queue history for a partner
   *
   * Response:
   * {
   *   "partner_id": "VENDOR-456",
   *   "total": 250,
   *   "webhook_summary": {
   *     "pending": 5,
   *     "sent": 240,
   *     "failed": 5
   *   },
   *   "recent_webhooks": [
   *     {
   *       "webhook_id": "uuid",
   *       "message_type": "invoice",
   *       "webhook_status": "SENT",
   *       "created_at": "2025-02-07T12:00:00Z"
   *     }
   *   ]
   * }
   */
  @Get('partner/:partnerId/history')
  @ApiOperation({
    summary: 'Partner Webhook History',
    description: 'View webhook queue history for a specific B2B partner',
  })
  @ApiParam({
    name: 'partnerId',
    type: 'string',
  })
  @ApiResponse({
    status: 200,
    description: 'Partner webhook history',
  })
  async getPartnerWebhookHistory(
    @Param('partnerId') partnerId: string,
    @Req() req: any,
  ) {
    this.logger.log(
      `[getPartnerWebhookHistory] START - PartnerId: ${partnerId}`,
    );

    try {
      const limit = req.query.limit || 50;
      const offset = req.query.offset || 0;

      const result = await this.webhookNotifierService.getWebhookHistory(
        partnerId,
        limit,
        offset,
      );

      this.logger.log(
        `[getPartnerWebhookHistory] SUCCESS - Found ${result.total} webhooks`,
      );

      // Calculate summary
      const summary = {
        pending: result.webhooks.filter((w: any) => w.webhook_status === 'PENDING').length,
        sent: result.webhooks.filter((w: any) => w.webhook_status === 'SENT').length,
        failed: result.webhooks.filter((w: any) => w.webhook_status === 'FAILED').length,
      };

      return {
        partner_id: partnerId,
        total: result.total,
        limit,
        offset,
        webhook_summary: summary,
        recent_webhooks: result.webhooks,
      };
    } catch (error) {
      this.logger.error(
        `[getPartnerWebhookHistory] FAILED - ${error.message}`,
      );
      throw error;
    }
  }

  /**
   * POST /api/b2b/webhooks/process-pending
   * Manually trigger webhook processing (normally runs on schedule)
   *
   * Response (202 Accepted):
   * {
   *   "status": "PROCESSING",
   *   "message": "Webhook processing initiated",
   *   "job_id": "job-uuid"
   * }
   */
  @Post('process-pending')
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({
    summary: 'Process Pending Webhooks',
    description: 'Manually trigger webhook delivery processing (usually automatic every 5 minutes)',
  })
  @ApiResponse({
    status: 202,
    description: 'Processing started',
  })
  async processPendingWebhooks(
    @CurrentUser() user: any,
  ) {
    this.logger.log(
      `[processPendingWebhooks] START - Triggered by: ${user.id}`,
    );

    try {
      const result = await this.webhookNotifierService.processPendingWebhooks();

      this.logger.log(
        `[processPendingWebhooks] SUCCESS - Processed: ${result.processed}, Sent: ${result.sent}, Failed: ${result.failed}`,
      );

      return {
        status: 'PROCESSING',
        message: 'Webhook processing completed',
        processed: result.processed,
        sent: result.sent,
        failed: result.failed,
        triggered_by: user.email,
        triggered_at: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error(
        `[processPendingWebhooks] FAILED - ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }
}
