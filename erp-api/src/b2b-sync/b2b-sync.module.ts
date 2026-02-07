import { Module, Global } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HttpModule } from '@nestjs/axios';
import { ScheduleModule } from '@nestjs/schedule';

// Services
import { POIntakeService } from './services/po-intake.service';
import { InvoiceGeneratorService } from './services/invoice-generator.service';
import { WebhookNotifierService } from './services/webhook-notifier.service';

// Controllers
import { PurchaseOrderController } from './controllers/purchase-order.controller';
import { InvoiceController } from './controllers/invoice.controller';
import { WebhookAdminController } from './controllers/webhook-admin.controller';

// Scheduled tasks
import { B2BScheduledTasks } from './tasks/b2b-scheduled.tasks';

/**
 * B2B-Sync Module
 *
 * Provides complete B2B EDI integration capabilities:
 * - Purchase Order intake and tracking
 * - Invoice generation and ledger posting
 * - Webhook delivery with retry mechanism
 * - Partner management and onboarding
 *
 * Export Strategy:
 * - Services exported for use in other modules
 * - Controllers auto-registered in routes
 * - Scheduled tasks auto-executed on startup
 */
@Global()
@Module({
  imports: [
    // Database entities
    TypeOrmModule.forFeature([
      // Entity names (assuming these are registered in TypeORM)
      'B2bPartner',
      'B2bPurchaseOrder',
      'B2bPurchaseOrderLine',
      'B2bInvoice',
      'B2bInvoiceLine',
      'B2bEDIAuditLog',
      'B2bWebhookQueue',
      'B2bWebhookDeliveryLog',
      'B2bWebhookDeadLetter',
      'B2bJobQueue',
    ]),

    // HTTP client for external calls (webhooks, accounting service)
    HttpModule.register({
      timeout: 30000,
      maxRedirects: 5,
    }),

    // Scheduled task support
    ScheduleModule.forRoot(),
  ],

  controllers: [
    PurchaseOrderController,
    InvoiceController,
    WebhookAdminController,
  ],

  providers: [
    // Services
    POIntakeService,
    InvoiceGeneratorService,
    WebhookNotifierService,

    // Scheduled tasks
    B2BScheduledTasks,
  ],

  exports: [
    // Export services for use in other modules
    POIntakeService,
    InvoiceGeneratorService,
    WebhookNotifierService,
  ],
})
export class B2bSyncModule {}

/**
 * Usage in other modules:
 *
 * 1. Import in app.module.ts:
 *    @Module({
 *      imports: [B2bSyncModule, ...],
 *    })
 *    export class AppModule {}
 *
 * 2. Inject services in other services:
 *    constructor(private b2bService: POIntakeService) {}
 *
 * 3. API Routes:
 *    - POST   /api/b2b/purchase-orders          → submitPurchaseOrder()
 *    - GET    /api/b2b/purchase-orders/{poNum}  → getPOStatus()
 *    - GET    /api/b2b/purchase-orders          → listPartnerPOs()
 *    - POST   /api/b2b/invoices                 → generateInvoiceFromOrder()
 *    - GET    /api/b2b/invoices/{invNum}        → getInvoice()
 *    - GET    /api/b2b/webhooks/stats           → getQueueStats()
 *    - POST   /api/b2b/webhooks/{webhookId}/retry → retryDeadLetter()
 *
 * 4. Scheduled Tasks (auto-executed):
 *    - Every 5 mins:  processPendingWebhooks()
 *    - Every 1 min:   processLedgerPostingJobs()
 *    - Every 1 hour:  cleanupExpiredAuditLogs()
 */
