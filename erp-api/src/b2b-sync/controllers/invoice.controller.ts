import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  Query,
  UseGuards,
  UseFilters,
  Logger,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { InvoiceGeneratorService } from '../services/invoice-generator.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ClientIP } from '../../common/decorators/client-ip.decorator';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { B2BExceptionFilter } from '../filters/b2b-exception.filter';

/**
 * Invoice Controller
 *
 * REST API for B2B invoice management:
 * - Generate invoices from completed POs
 * - Track invoice status and delivery
 * - Resend failed invoices
 *
 * All endpoints require JWT Bearer token with 'b2b:invoice:write' scope
 */
@ApiTags('B2B Invoices')
@Controller('b2b/invoices')
@UseGuards(JwtAuthGuard)
@UseFilters(B2BExceptionFilter)
@ApiBearerAuth()
export class InvoiceController {
  private readonly logger = new Logger(InvoiceController.name);

  constructor(private readonly invoiceGeneratorService: InvoiceGeneratorService) {}

  /**
   * POST /api/b2b/invoices
   * Generate invoice from completed purchase order
   *
   * Request body:
   * {
   *   "po_number": "PO-202501-00123",
   *   "partner_id": "VENDOR-456",
   *   "invoice_date": "2025-02-07T00:00:00Z",
   *   "invoice_lines": [
   *     {
   *       "po_line_number": 1,
   *       "description": "Widget A",
   *       "quantity": 100,
   *       "unit_price": 50.00,
   *       "line_total": 5000.00,
   *       "hsn_code": "8517.62",
   *       "gst_rate": 18
   *     }
   *   ],
   *   "invoice_total": 5900.00,
   *   "invoice_currency": "INR",
   *   "invoice_notes": "Payment due within 30 days"
   * }
   *
   * Response (202 Accepted):
   * {
   *   "invoice_number": "GEN-INV-20250207-00001",
   *   "message_id": "INV-GEN-INV-20250207-00001-a1b2c3d4",
   *   "status": "PENDING",
   *   "webhook_queued": true,
   *   "ledger_posting_queued": true
   * }
   */
  @Post()
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({
    summary: 'Generate Invoice from PO',
    description:
      'Create invoice from completed PO and queue for webhook delivery + ledger posting',
  })
  @ApiResponse({
    status: 202,
    description: 'Invoice accepted for generation (async processing)',
    schema: {
      type: 'object',
      properties: {
        invoice_number: { type: 'string', example: 'GEN-INV-20250207-00001' },
        message_id: { type: 'string', example: 'INV-GEN-INV-20250207-00001-a1b2c3d4' },
        status: { type: 'string', enum: ['PENDING', 'SENT'] },
        webhook_queued: { type: 'boolean' },
        ledger_posting_queued: { type: 'boolean' },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid invoice data or missing PO',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized (missing or invalid JWT)',
  })
  @ApiResponse({
    status: 409,
    description: 'Conflict (PO already invoiced or in wrong state)',
  })
  async generateInvoice(
    @Body() request: any,
    @CurrentUser() user: any,
    @ClientIP() clientIp: string,
  ) {
    this.logger.log(
      `[generateInvoice] START - PO: ${request.po_number}, Partner: ${request.partner_id}, User: ${user.id}`,
    );

    try {
      const result = await this.invoiceGeneratorService.generateInvoice(
        request,
        user.id,
        clientIp,
      );

      this.logger.log(
        `[generateInvoice] SUCCESS - Invoice: ${result.invoice_number}, MessageID: ${result.message_id}`,
      );

      return {
        invoice_number: result.invoice_number,
        message_id: result.message_id,
        status: 'PENDING',
        webhook_queued: true,
        ledger_posting_queued: true,
        created_at: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error(
        `[generateInvoice] FAILED - ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * GET /api/b2b/invoices/{invoiceNumber}
   * Retrieve invoice details and status
   *
   * Response:
   * {
   *   "invoice_id": "uuid",
   *   "invoice_number": "GEN-INV-20250207-00001",
   *   "po_number": "PO-202501-00123",
   *   "partner_id": "VENDOR-456",
   *   "invoice_date": "2025-02-07T00:00:00Z",
   *   "invoice_total": 5900.00,
   *   "invoice_currency": "INR",
   *   "webhook_status": "SENT",
   *   "ledger_posted": true,
   *   "ledger_posted_at": "2025-02-07T12:34:56Z",
   *   "invoice_json": {...},
   *   "created_at": "2025-02-07T10:00:00Z",
   *   "updated_at": "2025-02-07T12:34:56Z"
   * }
   */
  @Get(':invoiceNumber')
  @ApiOperation({
    summary: 'Get Invoice Details',
    description: 'Retrieve full invoice record including JSON payload and delivery status',
  })
  @ApiParam({
    name: 'invoiceNumber',
    type: 'string',
    description: 'Invoice number (e.g., GEN-INV-20250207-00001)',
  })
  @ApiQuery({
    name: 'partner_id',
    type: 'string',
    required: true,
    description: 'Partner ID to verify ownership',
  })
  @ApiResponse({
    status: 200,
    description: 'Invoice found',
    schema: {
      type: 'object',
      properties: {
        invoice_id: { type: 'string' },
        invoice_number: { type: 'string' },
        po_number: { type: 'string' },
        invoice_total: { type: 'number' },
        webhook_status: { type: 'string', enum: ['PENDING', 'SENT', 'FAILED'] },
        created_at: { type: 'string' },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Invoice not found',
  })
  async getInvoice(
    @Param('invoiceNumber') invoiceNumber: string,
    @Query('partner_id') partnerId: string,
  ) {
    this.logger.log(
      `[getInvoice] START - Invoice: ${invoiceNumber}, Partner: ${partnerId}`,
    );

    try {
      const invoice = await this.invoiceGeneratorService.getInvoice(
        invoiceNumber,
        partnerId,
      );

      this.logger.log(
        `[getInvoice] SUCCESS - Invoice: ${invoiceNumber}`,
      );

      return invoice;
    } catch (error) {
      this.logger.error(
        `[getInvoice] FAILED - ${error.message}`,
      );
      throw error;
    }
  }

  /**
   * GET /api/b2b/invoices
   * List all invoices for a partner (paginated)
   *
   * Query Parameters:
   * - partner_id (required): Partner ID
   * - limit (optional, default=50): Number of records per page
   * - offset (optional, default=0): Page offset
   *
   * Response:
   * {
   *   "total": 150,
   *   "limit": 50,
   *   "offset": 0,
   *   "invoices": [
   *     {
   *       "invoice_id": "uuid",
   *       "invoice_number": "GEN-INV-20250207-00001",
   *       "po_number": "PO-202501-00123",
   *       "invoice_date": "2025-02-07T00:00:00Z",
   *       "invoice_total": 5900.00,
   *       "webhook_status": "SENT",
   *       "created_at": "2025-02-07T10:00:00Z"
   *     }
   *   ]
   * }
   */
  @Get()
  @ApiOperation({
    summary: 'List Invoices',
    description: 'List all invoices for a partner with pagination',
  })
  @ApiQuery({
    name: 'partner_id',
    type: 'string',
    required: true,
    description: 'Partner ID',
  })
  @ApiQuery({
    name: 'limit',
    type: 'number',
    required: false,
    default: 50,
    description: 'Records per page',
  })
  @ApiQuery({
    name: 'offset',
    type: 'number',
    required: false,
    default: 0,
    description: 'Page offset',
  })
  @ApiResponse({
    status: 200,
    description: 'Invoice list',
    schema: {
      type: 'object',
      properties: {
        total: { type: 'number' },
        invoices: {
          type: 'array',
          items: { type: 'object' },
        },
      },
    },
  })
  async listInvoices(
    @Query('partner_id') partnerId: string,
    @Query('limit') limit: number = 50,
    @Query('offset') offset: number = 0,
  ) {
    this.logger.log(
      `[listInvoices] START - Partner: ${partnerId}, Limit: ${limit}, Offset: ${offset}`,
    );

    try {
      const result = await this.invoiceGeneratorService.listPartnerInvoices(
        partnerId,
        Math.min(limit, 500), // Cap at 500
        offset,
      );

      this.logger.log(
        `[listInvoices] SUCCESS - Found ${result.total} invoices`,
      );

      return {
        total: result.total,
        limit,
        offset,
        invoices: result.invoices,
      };
    } catch (error) {
      this.logger.error(
        `[listInvoices] FAILED - ${error.message}`,
      );
      throw error;
    }
  }

  /**
   * POST /api/b2b/invoices/{invoiceNumber}/resend
   * Resend invoice to partner (webhook retry)
   *
   * Response (202 Accepted):
   * {
   *   "invoice_number": "GEN-INV-20250207-00001",
   *   "status": "RESENDING",
   *   "message": "Invoice queued for webhook delivery"
   * }
   */
  @Post(':invoiceNumber/resend')
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({
    summary: 'Resend Invoice',
    description: 'Requeue invoice for webhook delivery to partner',
  })
  @ApiParam({
    name: 'invoiceNumber',
    type: 'string',
  })
  @ApiQuery({
    name: 'partner_id',
    type: 'string',
    required: true,
  })
  @ApiResponse({
    status: 202,
    description: 'Invoice resend accepted',
  })
  async resendInvoice(
    @Param('invoiceNumber') invoiceNumber: string,
    @Query('partner_id') partnerId: string,
  ) {
    this.logger.log(
      `[resendInvoice] START - Invoice: ${invoiceNumber}, Partner: ${partnerId}`,
    );

    try {
      await this.invoiceGeneratorService.resendInvoice(
        invoiceNumber,
        partnerId,
      );

      this.logger.log(
        `[resendInvoice] SUCCESS - Invoice: ${invoiceNumber}`,
      );

      return {
        invoice_number: invoiceNumber,
        status: 'RESENDING',
        message: 'Invoice queued for webhook delivery',
      };
    } catch (error) {
      this.logger.error(
        `[resendInvoice] FAILED - ${error.message}`,
      );
      throw error;
    }
  }
}
