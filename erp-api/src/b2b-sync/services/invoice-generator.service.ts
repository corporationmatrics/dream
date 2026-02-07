import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Connection } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import * as crypto from 'crypto';

// Entities (assumed to exist)
// export interface B2BInvoice {
//   id: string;
//   partner_id: string;
//   po_number: string;
//   invoice_number: string;
//   invoice_date: Date;
//   invoice_json: Record<string, unknown>;
//   webhook_status: 'PENDING' | 'SENT' | 'FAILED';
//   created_at: Date;
//   updated_at: Date;
// }

interface B2BInvoiceRequest {
  po_number: string;
  partner_id: string;
  invoice_date: Date;
  invoice_lines: B2BInvoiceLine[];
  invoice_total: number;
  invoice_currency: string;
  invoice_notes?: string;
}

interface B2BInvoiceLine {
  po_line_number: number;
  description: string;
  quantity: number;
  unit_price: number;
  line_total: number;
  hsn_code?: string;
  gst_rate: number;
}

interface B2BInvoiceJSON {
  message_id: string;
  message_type: 'invoice';
  timestamp: string;
  sender: {
    party_id: string;
    party_name: string;
    party_role: string;
  };
  receiver: {
    party_id: string;
  };
  invoice_header: {
    invoice_number: string;
    invoice_date: string;
    invoice_currency: string;
    po_reference: string;
    invoice_total: number;
    invoice_notes?: string;
  };
  invoice_lines: B2BInvoiceLine[];
  digital_signature: string;
  schema_version: string;
}

interface LedgerPostRequest {
  invoice_number: string;
  vendor_id: string;
  vendor_name: string;
  vendor_gstin: string;
  invoice_total: number;
  invoice_date: Date;
  currency: string;
  invoice_lines: B2BInvoiceLine[];
  po_reference: string;
}

@Injectable()
export class InvoiceGeneratorService {
  private readonly logger = new Logger(InvoiceGeneratorService.name);

  constructor(
    @InjectRepository('B2BInvoice')
    private readonly invoiceRepository: Repository<any>,
    @InjectRepository('B2BPurchaseOrder')
    private readonly poRepository: Repository<any>,
    @InjectRepository('B2BWebhookQueue')
    private readonly webhookQueueRepository: Repository<any>,
    @InjectRepository('B2BEDIAuditLog')
    private readonly auditLogRepository: Repository<any>,
    private readonly connection: Connection,
    // Inject HTTP client for ledger posting
    private readonly httpService: any, // AxiosService or similar
  ) {}

  /**
   * Generate invoice from purchase order completion
   * Step 1: Load PO + validate state
   * Step 2: Create invoice number (GEN-INVOICE-{YYYYMMDD}-{SEQ})
   * Step 3: Build JSON-EDI invoice payload
   * Step 4: Digitally sign payload
   * Step 5: Persist to b2b_invoices table
   * Step 6: Queue webhook notification to buyer
   * Step 7: POST to Spring Boot ledger service (async)
   * Step 8: Audit trail
   */
  async generateInvoice(
    request: B2BInvoiceRequest,
    userId: string,
    clientIp: string,
  ): Promise<{ invoice_number: string; message_id: string }> {
    const queryRunner = this.connection.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      this.logger.debug(
        `[generateInvoice] START for PO: ${request.po_number}, Partner: ${request.partner_id}`,
      );

      // ============ STEP 1: Load and validate PO ============
      const po = await queryRunner.manager.query(
        `SELECT * FROM b2b_purchase_orders 
        WHERE po_number = $1 AND partner_id = $2`,
        [request.po_number, request.partner_id],
      );

      if (!po || po.length === 0) {
        throw new BadRequestException(
          `PO not found: ${request.po_number} for partner ${request.partner_id}`,
        );
      }

      const poRecord = po[0];

      // Validate PO is in receivable state
      if (!['ACCEPTED', 'PARTIALLY_RECEIVED', 'READY_FOR_INVOICE'].includes(poRecord.po_status)) {
        throw new BadRequestException(
          `PO ${request.po_number} cannot be invoiced. Current status: ${poRecord.po_status}`,
        );
      }

      // ============ STEP 2: Generate invoice number ============
      const invoiceNumber = await this.generateInvoiceNumber(queryRunner);
      const messageId = `INV-${invoiceNumber}-${uuidv4().substring(0, 8)}`;

      this.logger.debug(
        `[generateInvoice] Generated invoice#: ${invoiceNumber}, messageId: ${messageId}`,
      );

      // ============ STEP 3: Build JSON-EDI invoice ============
      const invoiceJson = this.buildJSONEDIInvoice(
        {
          invoiceNumber,
          messageId,
          poRecord,
          request,
        },
      );

      this.logger.debug(
        `[generateInvoice] JSON-EDI payload built: ${JSON.stringify(invoiceJson).substring(0, 200)}...`,
      );

      // ============ STEP 4: Digital signature (GPG-like) ============
      const signature = this.signInvoicePayload(invoiceJson, userId);
      invoiceJson.digital_signature = signature;

      this.logger.debug(`[generateInvoice] Signed with SHA-256 signature`);

      // ============ STEP 5: Persist invoice to database ============
      const invoiceRows = await queryRunner.manager.query(
        `INSERT INTO b2b_invoices 
        (invoice_id, partner_id, po_number, invoice_number, invoice_date, 
         invoice_total, invoice_currency, invoice_json, webhook_status, created_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())
        RETURNING *`,
        [
          uuidv4(),
          request.partner_id,
          request.po_number,
          invoiceNumber,
          request.invoice_date,
          request.invoice_total,
          request.invoice_currency,
          JSON.stringify(invoiceJson),
          'PENDING',
        ],
      );

      const invoiceRecord = invoiceRows[0];
      this.logger.debug(`[generateInvoice] Invoice persisted: ${invoiceRecord.invoice_id}`);

      // ============ STEP 6: Queue webhook notification ============
      await this.queueWebhookNotification(
        queryRunner,
        request.partner_id,
        invoiceNumber,
        invoiceJson,
      );

      this.logger.debug(
        `[generateInvoice] Webhook queued for partner: ${request.partner_id}`,
      );

      // ============ STEP 7: POST to Spring Boot ledger (async via job queue) ============
      await this.queueLedgerPosting(queryRunner, invoiceNumber, request, poRecord);

      this.logger.debug(`[generateInvoice] Ledger posting queued for: ${invoiceNumber}`);

      // ============ STEP 8: Audit trail ============
      await queryRunner.manager.query(
        `INSERT INTO b2b_edi_audit_log 
        (audit_id, partner_id, edi_message_id, message_type, direction, 
         edi_payload, processing_status, user_id, client_ip, created_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())`,
        [
          uuidv4(),
          request.partner_id,
          messageId,
          'INVOICE',
          'OUTBOUND',
          JSON.stringify(invoiceJson),
          'GENERATED',
          userId,
          clientIp,
        ],
      );

      this.logger.debug(
        `[generateInvoice] Audit log created, messageId: ${messageId}`,
      );

      // ============ Update PO status to INVOICED ============
      await queryRunner.manager.query(
        `UPDATE b2b_purchase_orders 
        SET po_status = $1, invoice_reference = $2, updated_at = NOW()
        WHERE po_number = $3`,
        ['INVOICED', invoiceNumber, request.po_number],
      );

      this.logger.debug(`[generateInvoice] PO status updated to INVOICED`);

      await queryRunner.commitTransaction();

      this.logger.info(
        `[generateInvoice] SUCCESS: Invoice ${invoiceNumber} generated for PO ${request.po_number}`,
      );

      return {
        invoice_number: invoiceNumber,
        message_id: messageId,
      };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.logger.error(
        `[generateInvoice] FAILED: ${error.message}`,
        error.stack,
      );
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Get invoice by invoice number
   */
  async getInvoice(invoiceNumber: string, partnerId: string): Promise<any> {
    const result = await this.invoiceRepository.query(
      `SELECT invoice_id, partner_id, po_number, invoice_number, invoice_date,
              invoice_total, invoice_currency, invoice_json, webhook_status, created_at
       FROM b2b_invoices
       WHERE invoice_number = $1 AND partner_id = $2
       LIMIT 1`,
      [invoiceNumber, partnerId],
    );

    if (!result || result.length === 0) {
      throw new BadRequestException(
        `Invoice not found: ${invoiceNumber}`,
      );
    }

    return result[0];
  }

  /**
   * List invoices for a partner (paginated)
   */
  async listPartnerInvoices(
    partnerId: string,
    limit: number = 50,
    offset: number = 0,
  ): Promise<{ total: number; invoices: any[] }> {
    const countResult = await this.invoiceRepository.query(
      `SELECT COUNT(*) as total FROM b2b_invoices WHERE partner_id = $1`,
      [partnerId],
    );

    const total = countResult[0].total;

    const invoices = await this.invoiceRepository.query(
      `SELECT invoice_id, partner_id, po_number, invoice_number, invoice_date,
              invoice_total, invoice_currency, webhook_status, created_at
       FROM b2b_invoices
       WHERE partner_id = $1
       ORDER BY created_at DESC
       LIMIT $2 OFFSET $3`,
      [partnerId, limit, offset],
    );

    return { total, invoices };
  }

  /**
   * Resend invoice to partner (webhook retry)
   */
  async resendInvoice(invoiceNumber: string, partnerId: string): Promise<void> {
    const invoice = await this.getInvoice(invoiceNumber, partnerId);
    const invoiceJson = invoice.invoice_json;

    await this.queueWebhookNotification(
      null, // Use raw query instead of transaction
      partnerId,
      invoiceNumber,
      invoiceJson,
    );

    this.logger.info(`[resendInvoice] Requeued for: ${invoiceNumber}`);
  }

  // ==================== PRIVATE HELPERS ====================

  /**
   * Generate sequential invoice number with date prefix
   */
  private async generateInvoiceNumber(queryRunner: any): Promise<string> {
    const today = new Date().toISOString().split('T')[0].replace(/-/g, ''); // YYYYMMDD

    const result = await queryRunner.manager.query(
      `SELECT nextval('b2b_invoice_sequence') as seq`,
    );

    const seq = String(result[0].seq).padStart(5, '0');
    return `GEN-INV-${today}-${seq}`;
  }

  /**
   * Build JSON-EDI invoice payload (follows design spec)
   */
  private buildJSONEDIInvoice(data: {
    invoiceNumber: string;
    messageId: string;
    poRecord: any;
    request: B2BInvoiceRequest;
  }): B2BInvoiceJSON {
    const { invoiceNumber, messageId, poRecord, request } = data;

    // Load partner header from PO (or fetch separately)
    const senderPartyId = process.env.DREAM_ERP_PARTY_ID || 'DREAM-001';
    const senderPartyName = process.env.DREAM_ERP_NAME || 'Dream ERP Ltd';

    return {
      message_id: messageId,
      message_type: 'invoice',
      timestamp: new Date().toISOString(),
      sender: {
        party_id: senderPartyId,
        party_name: senderPartyName,
        party_role: 'SELLER',
      },
      receiver: {
        party_id: request.partner_id,
      },
      invoice_header: {
        invoice_number: invoiceNumber,
        invoice_date: request.invoice_date.toISOString().split('T')[0],
        invoice_currency: request.invoice_currency,
        po_reference: request.po_number,
        invoice_total: request.invoice_total,
        invoice_notes: request.invoice_notes || '',
      },
      invoice_lines: request.invoice_lines,
      digital_signature: '', // To be filled after signing
      schema_version: '1.0',
    };
  }

  /**
   * Sign invoice payload using SHA-256 (simplified GPG-like structure)
   * In production, use actual GPG or HSM
   */
  private signInvoicePayload(payload: any, userId: string): string {
    const payloadString = JSON.stringify(payload);
    const secretKey = process.env.EDI_SIGNING_KEY || 'dream-edi-secret-key';

    const signature = crypto
      .createHmac('sha256', secretKey)
      .update(payloadString)
      .digest('hex');

    return signature;
  }

  /**
   * Queue webhook notification to buyer
   */
  private async queueWebhookNotification(
    queryRunner: any,
    partnerId: string,
    invoiceNumber: string,
    invoiceJson: B2BInvoiceJSON,
  ): Promise<void> {
    // Get partner webhook endpoint
    const partnerResult = await (queryRunner
      ? queryRunner.manager.query
      : this.invoiceRepository.query).call(
      queryRunner ? queryRunner.manager : this.invoiceRepository,
      `SELECT webhook_endpoint, webhook_auth_token FROM b2b_partners 
       WHERE partner_id = $1 AND webhook_endpoint IS NOT NULL`,
      [partnerId],
    );

    if (!partnerResult || partnerResult.length === 0) {
      this.logger.warn(
        `[queueWebhookNotification] No webhook endpoint for partner: ${partnerId}`,
      );
      return;
    }

    const partner = partnerResult[0];

    // Insert into webhook queue
    const manager = queryRunner ? queryRunner.manager : this.invoiceRepository;
    await manager.query(
      `INSERT INTO b2b_webhook_queue 
      (webhook_id, partner_id, message_type, message_id, message_payload, 
       webhook_url, auth_token, retry_count, next_retry_at, webhook_status, created_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW())`,
      [
        uuidv4(),
        partnerId,
        'invoice',
        invoiceJson.message_id,
        JSON.stringify(invoiceJson),
        partner.webhook_endpoint,
        partner.webhook_auth_token,
        0, // Initial retry count
        new Date(), // Retry immediately
        'PENDING',
      ],
    );
  }

  /**
   * Queue ledger posting job (async)
   * This typically goes to a job queue (Bull, RabbitMQ, etc)
   * For now, we queue it in database
   */
  private async queueLedgerPosting(
    queryRunner: any,
    invoiceNumber: string,
    request: B2BInvoiceRequest,
    poRecord: any,
  ): Promise<void> {
    // Build ledger posting request
    const ledgerRequest: LedgerPostRequest = {
      invoice_number: invoiceNumber,
      vendor_id: poRecord.vendor_id,
      vendor_name: poRecord.vendor_name,
      vendor_gstin: poRecord.vendor_gstin,
      invoice_total: request.invoice_total,
      invoice_date: request.invoice_date,
      currency: request.invoice_currency,
      invoice_lines: request.invoice_lines,
      po_reference: request.po_number,
    };

    // Insert into a job queue table (or use Bull/RabbitMQ)
    await queryRunner.manager.query(
      `INSERT INTO b2b_job_queue 
      (job_id, job_type, job_payload, job_status, retry_count, created_at)
      VALUES ($1, $2, $3, $4, $5, NOW())`,
      [
        uuidv4(),
        'LEDGER_POST_INVOICE',
        JSON.stringify(ledgerRequest),
        'PENDING',
        0,
      ],
    );

    this.logger.debug(`[queueLedgerPosting] Job queued for invoice: ${invoiceNumber}`);
  }

  /**
   * Process ledger posting (called by job worker)
   * This would be triggered by a scheduled job worker
   */
  async processLedgerPosting(jobId: string): Promise<void> {
    try {
      // Fetch job from queue
      const jobResult = await this.invoiceRepository.query(
        `SELECT job_payload FROM b2b_job_queue 
         WHERE job_id = $1 AND job_type = 'LEDGER_POST_INVOICE'`,
        [jobId],
      );

      if (!jobResult || jobResult.length === 0) {
        this.logger.warn(`[processLedgerPosting] Job not found: ${jobId}`);
        return;
      }

      const ledgerRequest: LedgerPostRequest = JSON.parse(jobResult[0].job_payload);

      // POST to Spring Boot accounting service
      await this.httpService.post(
        `${process.env.ACCOUNTING_SERVICE_URL}/invoices/post-from-edi`,
        ledgerRequest,
        {
          headers: {
            Authorization: `Bearer ${process.env.ACCOUNTING_SERVICE_TOKEN}`,
          },
          timeout: 30000,
        },
      );

      // Mark job as completed
      await this.invoiceRepository.query(
        `UPDATE b2b_job_queue SET job_status = 'COMPLETED', updated_at = NOW() 
         WHERE job_id = $1`,
        [jobId],
      );

      this.logger.info(`[processLedgerPosting] Completed for invoice: ${ledgerRequest.invoice_number}`);
    } catch (error) {
      this.logger.error(
        `[processLedgerPosting] Failed for job ${jobId}: ${error.message}`,
        error.stack,
      );

      // Update retry count and reschedule
      const result = await this.invoiceRepository.query(
        `SELECT retry_count FROM b2b_job_queue WHERE job_id = $1`,
        [jobId],
      );

      const retryCount = result[0].retry_count + 1;
      const maxRetries = 5;

      if (retryCount >= maxRetries) {
        await this.invoiceRepository.query(
          `UPDATE b2b_job_queue SET job_status = 'FAILED', retry_count = $1, updated_at = NOW() 
           WHERE job_id = $2`,
          [retryCount, jobId],
        );
      } else {
        const backoffMs = Math.pow(2, retryCount) * 60000; // Exponential backoff
        const nextRetry = new Date(Date.now() + backoffMs);

        await this.invoiceRepository.query(
          `UPDATE b2b_job_queue SET retry_count = $1, next_retry_at = $2, updated_at = NOW() 
           WHERE job_id = $3`,
          [retryCount, nextRetry, jobId],
        );
      }

      throw error;
    }
  }
}
