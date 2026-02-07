import {
  Controller,
  Post,
  Get,
  Query,
  Body,
  Param,
  HttpCode,
  Ip,
  UseGuards,
  Headers,
  Logger,
  BadRequestException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
  ApiBody,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';

import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { User } from '../../users/entities/user.entity';
import { POIntakeService } from '../services/po-intake.service';
import { POIntakeDto } from '../dtos/po-intake.dto';

@ApiTags('B2B Purchase Orders')
@ApiBearerAuth('JWT')
@Controller('api/b2b/purchase-orders')
@UseGuards(AuthGuard('jwt'))
export class PurchaseOrderController {
  private readonly logger = new Logger(PurchaseOrderController.name);

  constructor(private poIntakeService: POIntakeService) {}

  /**
   * POST /api/b2b/purchase-orders
   * Submit a new purchase order in JSON-EDI format
   */
  @Post()
  @HttpCode(202)
  @ApiOperation({
    summary: 'Submit a new Purchase Order',
    description: 'Submit a PO in JSON-EDI format. Returns 202 Accepted.',
  })
  @ApiBody({
    description: 'Purchase Order JSON-EDI payload',
    schema: {
      type: 'object',
      properties: {
        message_type: { type: 'string', enum: ['purchase_order'] },
        message_version: { type: 'string', example: '1.0' },
        timestamp: { type: 'string', format: 'date-time' },
        sender: {
          type: 'object',
          properties: {
            party_id: { type: 'string' },
            party_name: { type: 'string' },
            webhook_url: { type: 'string', format: 'uri' },
          },
        },
        po_header: {
          type: 'object',
          properties: {
            po_number: { type: 'string' },
            po_date: { type: 'string', format: 'date' },
            currency: { type: 'string', enum: ['INR', 'USD', 'EUR'] },
          },
        },
        po_lines: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              line_number: { type: 'number' },
              product_id: { type: 'string' },
              qty: { type: 'number' },
              unit_price: { type: 'number' },
            },
          },
        },
        po_summary: {
          type: 'object',
          properties: {
            subtotal: { type: 'number' },
            tax_total: { type: 'number' },
            grand_total: { type: 'number' },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 202,
    description: 'Purchase Order accepted for processing',
    schema: {
      type: 'object',
      properties: {
        status: { type: 'string', enum: ['ACKNOWLEDGED'] },
        po_number: { type: 'string' },
        internal_order_id: { type: 'string', format: 'uuid' },
        message_id: { type: 'string' },
        acknowledgment_date: { type: 'string', format: 'date-time' },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Validation error - Invalid PO format',
  })
  @ApiResponse({
    status: 409,
    description: 'Conflict - PO already exists',
  })
  async submitPurchaseOrder(
    @Body() poPayload: any,
    @Ip() clientIp: string,
    @CurrentUser() user: User,
  ): Promise<any> {
    this.logger.log(`Received PO: ${poPayload.po_header?.po_number}`);

    try {
      const result = await this.poIntakeService.processPurchaseOrder(
        poPayload,
        clientIp,
        user.id,
      );

      this.logger.log(
        `✅ PO Acknowledged: ${poPayload.po_header?.po_number}`,
      );

      return result;
    } catch (error) {
      this.logger.error(`❌ PO Processing Failed: ${error.message}`, error);
      throw error;
    }
  }

  /**
   * GET /api/b2b/purchase-orders/{poNumber}
   * Get status of a specific PO
   */
  @Get(':poNumber')
  @ApiOperation({
    summary: 'Get Purchase Order status',
    description: 'Track the status of a submitted purchase order',
  })
  @ApiParam({
    name: 'poNumber',
    description: 'Purchase Order number (e.g., PO-2026-001234)',
    example: 'PO-2026-001234',
  })
  @ApiQuery({
    name: 'partner_id',
    required: true,
    description: 'B2B Partner ID for authentication',
    example: 'B2B_PARTNER_001',
  })
  @ApiResponse({
    status: 200,
    description: 'PO status retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        po_number: { type: 'string' },
        po_status: { type: 'string', enum: ['NEW', 'ACKNOWLEDGED', 'REJECTED', 'PARTIAL'] },
        internal_order_id: { type: 'string', format: 'uuid' },
        grand_total: { type: 'number' },
        lines: {
          type: 'array',
          items: { type: 'object' },
        },
        last_updated: { type: 'string', format: 'date-time' },
      },
    },
  })
  @ApiResponse({ status: 404, description: 'PO not found' })
  async getPOStatus(
    @Param('poNumber') poNumber: string,
    @Query('partner_id') partnerId: string,
    @CurrentUser() user: User,
  ): Promise<any> {
    this.logger.log(`Fetching PO status: ${poNumber}`);

    return this.poIntakeService.getPOStatus(partnerId, poNumber);
  }

  /**
   * GET /api/b2b/purchase-orders
   * List all POs for a partner
   */
  @Get()
  @ApiOperation({
    summary: 'List all Purchase Orders',
    description: 'Get paginated list of POs submitted by your organization',
  })
  @ApiQuery({
    name: 'partner_id',
    required: true,
    description: 'B2B Partner ID',
    example: 'B2B_PARTNER_001',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Results per page',
    example: 50,
  })
  @ApiQuery({
    name: 'offset',
    required: false,
    type: Number,
    description: 'Results to skip',
    example: 0,
  })
  @ApiResponse({
    status: 200,
    description: 'List of POs',
    schema: {
      type: 'object',
      properties: {
        total: { type: 'number' },
        limit: { type: 'number' },
        offset: { type: 'number' },
        data: {
          type: 'array',
          items: { type: 'object' },
        },
      },
    },
  })
  async listPOs(
    @Query('partner_id') partnerId: string,
    @Query('limit') limit: number = 50,
    @Query('offset') offset: number = 0,
    @CurrentUser() user: User,
  ): Promise<any> {
    this.logger.log(
      `Listing POs for partner: ${partnerId} (limit=${limit}, offset=${offset})`,
    );

    return this.poIntakeService.listPartnerPOs(partnerId, limit, offset);
  }

  /**
   * POST /api/b2b/purchase-orders/{poNumber}/acknowledge
   * Acknowledge/reject a PO (optional - for explicit confirmation)
   */
  @Post(':poNumber/acknowledge')
  @HttpCode(200)
  @ApiOperation({
    summary: 'Acknowledge PO receipt',
    description: 'Send explicit acknowledgment or rejection of a PO',
  })
  @ApiParam({
    name: 'poNumber',
    description: 'Purchase Order number',
    example: 'PO-2026-001234',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        status: { type: 'string', enum: ['ACKNOWLEDGED', 'REJECTED', 'PARTIAL'] },
        acknowledgment_date: { type: 'string', format: 'date-time' },
        line_confirmations: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              line_number: { type: 'number' },
              qty_confirmed: { type: 'number' },
              qty_backorder: { type: 'number' },
            },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Acknowledgment received',
  })
  async acknowledgePO(
    @Param('poNumber') poNumber: string,
    @Body() payload: any,
    @CurrentUser() user: User,
  ): Promise<any> {
    this.logger.log(`Acknowledging PO: ${poNumber}`);

    // TODO: Implement explicit acknowledgment logic
    return {
      acknowledged: true,
      po_number: poNumber,
      acknowledgment_timestamp: new Date(),
    };
  }
}
