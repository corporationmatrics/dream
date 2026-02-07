import { Injectable, BadRequestException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { validate } from 'class-validator';
import * as Joi from 'joi';

import { B2BPartner } from './entities/b2b-partner.entity';
import { B2BPurchaseOrder } from './entities/b2b-purchase-order.entity';
import { B2BPOLine } from './entities/b2b-po-line.entity';
import { B2BEDIAuditLog } from './entities/b2b-edi-audit-log.entity';
import { B2BWebhookQueue } from './entities/b2b-webhook-queue.entity';

import { POIntakeDto } from './dtos/po-intake.dto';
import { POValidationService } from './services/po-validation.service';
import { POMapperService } from './services/po-mapper.service';
import { WebhookNotifierService } from './services/webhook-notifier.service';
import { AuditService } from './services/audit.service';

@Injectable()
export class POIntakeService {
  constructor(
    @InjectRepository(B2BPurchaseOrder)
    private poRepository: Repository<B2BPurchaseOrder>,
    
    @InjectRepository(B2BPOLine)
    private poLineRepository: Repository<B2BPOLine>,
    
    @InjectRepository(B2BPartner)
    private partnerRepository: Repository<B2BPartner>,
    
    @InjectRepository(B2BEDIAuditLog)
    private auditRepository: Repository<B2BEDIAuditLog>,
    
    @InjectRepository(B2BWebhookQueue)
    private webhookQueueRepository: Repository<B2BWebhookQueue>,
    
    private validationService: POValidationService,
    private mapperService: POMapperService,
    private webhookNotifier: WebhookNotifierService,
    private auditService: AuditService,
  ) {}

  /**
   * Main PO intake workflow
   * 1. Validate JSON schema
   * 2. Authenticate partner
   * 3. Check inventory
   * 4. Create internal order
   * 5. Send acknowledgment webhook
   * 6. Log to audit trail
   */
  async processPurchaseOrder(
    poJson: any,
    clientIp: string,
    userId: string,
  ): Promise<POIntakeDto> {
    let validationErrors = [];

    try {
      // Step 1: Validate JSON schema
      const { error: schemaError } = Joi.object({
        message_type: Joi.string().valid('purchase_order').required(),
        message_version: Joi.string().required(),
        timestamp: Joi.date().iso().required(),
        sender: Joi.object({
          party_id: Joi.string().required(),
          party_name: Joi.string().required(),
          contact_email: Joi.string().email().required(),
          webhook_url: Joi.string().uri().required(),
        }).required(),
        po_header: Joi.object({
          po_number: Joi.string().required(),
          po_date: Joi.date().required(),
          currency: Joi.string().valid('INR', 'USD', 'EUR').required(),
        }).required(),
        po_lines: Joi.array().min(1).items(
          Joi.object({
            line_number: Joi.number().required(),
            product_id: Joi.string().required(),
            qty: Joi.number().positive().required(),
            unit_price: Joi.number().positive().required(),
            tax_rate: Joi.number().min(0).max(1).required(),
          }),
        ).required(),
      }).validate(poJson);

      if (schemaError) {
        validationErrors.push({ field: 'schema', error: schemaError.message });
        throw new BadRequestException('PO_VALIDATION_FAILED', {
          cause: validationErrors,
        });
      }

      // Step 2: Authenticate & fetch B2B partner
      const partner = await this.partnerRepository.findOne({
        where: { party_id: poJson.sender.party_id },
      });

      if (!partner) {
        throw new BadRequestException('PARTNER_NOT_FOUND', {
          cause: [{ field: 'sender.party_id', error: 'Unknown B2B partner' }],
        });
      }

      if (partner.integration_status !== 'PRODUCTION') {
        throw new BadRequestException('PARTNER_NOT_ACTIVE', {
          cause: [
            {
              field: 'partner',
              error: `Partner integration status: ${partner.integration_status}`,
            },
          ],
        });
      }

      // Step 3: Check for duplicate PO
      const existingPO = await this.poRepository.findOne({
        where: { po_number: poJson.po_header.po_number, b2b_partner_id: partner.id },
      });

      if (existingPO) {
        throw new ConflictException('PO_ALREADY_EXISTS', {
          cause: [
            {
              field: 'po_header.po_number',
              error: `PO already received: ${existingPO.id}`,
            },
          ],
        });
      }

      // Step 4: Validate inventory & business rules
      const inventoryValidation = await this.validationService.validateInventory(
        poJson.po_lines,
      );

      if (!inventoryValidation.valid) {
        validationErrors = inventoryValidation.errors;
        throw new BadRequestException('INVENTORY_VALIDATION_FAILED', {
          cause: validationErrors,
        });
      }

      // Step 5: Create B2B PO record
      const b2bPO = this.poRepository.create({
        po_number: poJson.po_header.po_number,
        message_id: poJson.meta?.message_id || `MSG-${Date.now()}`,
        correlation_id: poJson.meta?.correlation_id,
        b2b_partner_id: partner.id,
        po_date: poJson.po_header.po_date,
        delivery_date: poJson.po_header.delivery_date,
        currency: poJson.po_header.currency,
        po_status: 'NEW',
        validation_status: 'VALID',
        subtotal: poJson.po_summary?.subtotal,
        tax_total: poJson.po_summary?.tax_total,
        shipping_charges: poJson.po_summary?.shipping_charges,
        grand_total: poJson.po_summary?.grand_total,
        billing_address: poJson.po_header?.billing_address,
        delivery_address: poJson.po_header?.delivery_address,
        payment_terms: poJson.po_header?.payment_terms,
        raw_json_payload: poJson,
        received_from_ip: clientIp,
        received_by_user: userId,
      });

      const savedPO = await this.poRepository.save(b2bPO);

      // Step 6: Create PO line items
      const poLines = poJson.po_lines.map((line, index) =>
        this.poLineRepository.create({
          b2b_po_id: savedPO.id,
          line_number: line.line_number,
          product_id: line.product_id,
          product_name: line.product_name,
          qty: line.qty,
          unit: line.unit,
          unit_price: line.unit_price,
          line_total: line.qty * line.unit_price,
          tax_rate: line.tax_rate,
          tax_amount: line.qty * line.unit_price * line.tax_rate,
          delivery_date: line.delivery_date,
          special_instructions: line.special_instructions,
          dream_product_id: inventoryValidation.productsMap?.[line.product_id]?.id,
        }),
      );

      await this.poLineRepository.save(poLines);

      // Step 7: Map to internal order (optional: create order now or wait for manual confirmation)
      // For MVP, we create order immediately upon valid PO
      const internalOrder = await this.mapperService.mapPOToOrder(
        savedPO,
        poLines,
        partner,
      );

      if (internalOrder) {
        await this.poRepository.update(savedPO.id, {
          internal_order_id: internalOrder.id,
          po_status: 'ACKNOWLEDGED',
          acknowledgment_sent_at: new Date(),
        });
      }

      // Step 8: Queue webhook notification for B2B partner
      await this.webhookQueueRepository.save({
        b2b_partner_id: partner.id,
        event_type: 'po.acknowledged',
        payload: {
          po_number: poJson.po_header.po_number,
          internal_order_id: internalOrder?.id,
          status: 'ACKNOWLEDGED',
          acknowledgment_date: new Date(),
        },
        status: 'PENDING',
      });

      // Step 9: Audit log
      await this.auditService.logEvent({
        message_type: 'purchase_order',
        message_id: savedPO.message_id,
        correlation_id: savedPO.correlation_id,
        b2b_partner_id: partner.id,
        event: 'PO_RECEIVED',
        event_status: 'SUCCESS',
        event_message: `PO ${savedPO.po_number} received and acknowledged`,
        raw_payload: poJson,
        triggered_by_user: userId,
        triggered_from_ip: clientIp,
      });

      return {
        status: 'ACKNOWLEDGED',
        po_number: savedPO.po_number,
        internal_order_id: internalOrder?.id,
        message_id: savedPO.message_id,
        acknowledgment_date: new Date(),
      };
    } catch (error) {
      // Log failure
      await this.auditService.logEvent({
        message_type: 'purchase_order',
        message_id: poJson.meta?.message_id,
        correlation_id: poJson.meta?.correlation_id,
        b2b_partner_id: (await this.partnerRepository.findOne({
          where: { party_id: poJson.sender?.party_id },
        }))?.id,
        event: 'PO_REJECTED',
        event_status: 'FAILURE',
        event_message: error.message,
        raw_payload: poJson,
        triggered_from_ip: clientIp,
      });

      throw error;
    }
  }

  /**
   * Get PO status by PO number
   */
  async getPOStatus(partnerId: string, poNumber: string) {
    const partner = await this.partnerRepository.findOne({
      where: { party_id: partnerId },
    });

    if (!partner) {
      throw new BadRequestException('PARTNER_NOT_FOUND');
    }

    const po = await this.poRepository.findOne({
      where: {
        b2b_partner_id: partner.id,
        po_number: poNumber,
      },
      relations: ['poLines', 'internalOrder'],
    });

    if (!po) {
      throw new BadRequestException('PO_NOT_FOUND');
    }

    return {
      po_number: po.po_number,
      po_status: po.po_status,
      internal_order_id: po.internal_order_id,
      po_date: po.po_date,
      grand_total: po.grand_total,
      lines: po.poLines,
      last_updated: po.updated_at,
    };
  }

  /**
   * Get all POs for a partner (paginated)
   */
  async listPartnerPOs(
    partnerId: string,
    limit: number = 50,
    offset: number = 0,
  ) {
    const partner = await this.partnerRepository.findOne({
      where: { party_id: partnerId },
    });

    if (!partner) {
      throw new BadRequestException('PARTNER_NOT_FOUND');
    }

    const [pos, total] = await this.poRepository.findAndCount({
      where: { b2b_partner_id: partner.id },
      order: { created_at: 'DESC' },
      take: limit,
      skip: offset,
    });

    return {
      total,
      limit,
      offset,
      data: pos,
    };
  }
}
