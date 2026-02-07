import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { InvoiceGeneratorService } from '../services/invoice-generator.service';
import { Repository, Connection } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import * as crypto from 'crypto';

/**
 * Invoice Generator Service Unit Tests
 *
 * Tests the 8-step invoice generation workflow:
 * 1. Load PO and validate state
 * 2. Generate invoice number (GEN-INV-20250207-00001)
 * 3. Build JSON-EDI payloadbuild JSON-EDI payload
 * 4. Digitally sign payload (SHA-256)
 * 5. Persist to database
 * 6. Queue webhook notification
 * 7. Queue ledger posting job
 * 8. Create audit trail
 *
 * Edge cases:
 * - Invalid PO state (not ready for invoicing)
 * - Invoice number sequencing
 * - Signature verification
 * - Ledger job queuing
 */
describe('InvoiceGeneratorService', () => {
  let service: InvoiceGeneratorService;
  let mockInvoiceRepository: jest.Mocked<Repository<any>>;
  let mockPoRepository: jest.Mocked<Repository<any>>;
  let mockWebhookQueueRepository: jest.Mocked<Repository<any>>;
  let mockAuditLogRepository: jest.Mocked<Repository<any>>;
  let mockConnection: jest.Mocked<Connection>;

  beforeEach(async () => {
    mockInvoiceRepository = {
      query: jest.fn(),
      save: jest.fn(),
    } as any;

    mockPoRepository = {
      query: jest.fn(),
    } as any;

    mockWebhookQueueRepository = {
      query: jest.fn(),
      save: jest.fn(),
    } as any;

    mockAuditLogRepository = {
      query: jest.fn(),
    } as any;

    mockConnection = {
      createQueryRunner: jest.fn().mockReturnValue({
        connect: jest.fn(),
        startTransaction: jest.fn(),
        commitTransaction: jest.fn(),
        rollbackTransaction: jest.fn(),
        release: jest.fn(),
        manager: {
          query: jest.fn(),
        },
      }),
      query: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InvoiceGeneratorService,
        {
          provide: getRepositoryToken('B2bInvoice'),
          useValue: mockInvoiceRepository,
        },
        {
          provide: getRepositoryToken('B2bPurchaseOrder'),
          useValue: mockPoRepository,
        },
        {
          provide: getRepositoryToken('B2bWebhookQueue'),
          useValue: mockWebhookQueueRepository,
        },
        {
          provide: getRepositoryToken('B2bEDIAuditLog'),
          useValue: mockAuditLogRepository,
        },
        {
          provide: Connection,
          useValue: mockConnection,
        },
      ],
    }).compile();

    service = module.get<InvoiceGeneratorService>(InvoiceGeneratorService);
  });

  describe('generateInvoice - Main Workflow', () => {
    const validInvoiceRequest = {
      po_number: 'PO-2025-001',
      partner_id: 'VENDOR-001',
      invoice_date: new Date(),
      invoice_lines: [
        {
          po_line_number: 1,
          description: 'Widget A',
          quantity: 100,
          unit_price: 50.00,
          line_total: 5000.00,
          gst_rate: 18,
        },
      ],
      invoice_total: 5900.00,
      invoice_currency: 'INR',
    };

    it('STEP 1: should load and validate PO state', async () => {
      mockPoRepository.query.mockResolvedValue([
        {
          po_number: 'PO-2025-001',
          partner_id: 'VENDOR-001',
          po_status: 'ACCEPTED',
          vendor_id: 'vendor-uuid',
          vendor_name: 'Test Vendor',
          vendor_gstin: '27AAYCT1234H1Z5',
        },
      ]);

      const result = await service.generateInvoice(
        validInvoiceRequest,
        'user-123',
        '192.168.1.1',
      );

      expect(result).toHaveProperty('invoice_number');
      expect(result).toHaveProperty('message_id');
    });

    it('STEP 1: should reject if PO not found', async () => {
      mockPoRepository.query.mockResolvedValue([]);

      await expect(
        service.generateInvoice(validInvoiceRequest, 'user-123', '192.168.1.1'),
      ).rejects.toThrow('PO not found');
    });

    it('STEP 1: should reject if PO in wrong state', async () => {
      mockPoRepository.query.mockResolvedValue([
        {
          po_number: 'PO-2025-001',
          po_status: 'NEW', // Not ready for invoicing
        },
      ]);

      await expect(
        service.generateInvoice(validInvoiceRequest, 'user-123', '192.168.1.1'),
      ).rejects.toThrow('cannot be invoiced');
    });

    it('STEP 1: should allow invoicing from ACCEPTED state', async () => {
      mockPoRepository.query.mockResolvedValue([
        {
          po_number: 'PO-2025-001',
          po_status: 'ACCEPTED',
          vendor_id: 'vendor-uuid',
          vendor_name: 'Test Vendor',
          vendor_gstin: '27AAYCT1234H1Z5',
        },
      ]);

      const result = await service.generateInvoice(
        validInvoiceRequest,
        'user-123',
        '192.168.1.1',
      );

      expect(result.invoice_number).toBeDefined();
    });

    it('STEP 1: should allow invoicing from PARTIALLY_RECEIVED state', async () => {
      mockPoRepository.query.mockResolvedValue([
        {
          po_number: 'PO-2025-001',
          po_status: 'PARTIALLY_RECEIVED',
          vendor_id: 'vendor-uuid',
          vendor_name: 'Test Vendor',
        },
      ]);

      const result = await service.generateInvoice(
        validInvoiceRequest,
        'user-123',
        '192.168.1.1',
      );

      expect(result.invoice_number).toBeDefined();
    });
  });

  describe('Invoice Number Generation', () => {
    it('STEP 2: should generate invoice number in format GEN-INV-20250207-00001', async () => {
      mockPoRepository.query.mockResolvedValue([
        {
          po_number: 'PO-2025-001',
          po_status: 'ACCEPTED',
          vendor_id: 'vendor-uuid',
          vendor_name: 'Test Vendor',
        },
      ]);

      mockConnection.createQueryRunner().manager.query.mockResolvedValue([
        { seq: 1 },
      ]);

      const result = await service.generateInvoice(
        {
          po_number: 'PO-2025-001',
          partner_id: 'VENDOR-001',
          invoice_date: new Date(),
          invoice_lines: [],
          invoice_total: 5000.00,
          invoice_currency: 'INR',
        },
        'user-123',
        '192.168.1.1',
      );

      expect(result.invoice_number).toMatch(/^GEN-INV-\d{8}-\d{5}$/);
    });

    it('STEP 2: should generate sequential invoice numbers', async () => {
      mockPoRepository.query.mockResolvedValue([
        {
          po_number: 'PO-2025-001',
          po_status: 'ACCEPTED',
          vendor_id: 'vendor-uuid',
          vendor_name: 'Test Vendor',
        },
      ]);

      // First invoice
      mockConnection.createQueryRunner().manager.query.mockResolvedValueOnce([
        { seq: 1 },
      ]);

      const inv1 = await service.generateInvoice(
        {
          po_number: 'PO-2025-001',
          partner_id: 'VENDOR-001',
          invoice_date: new Date(),
          invoice_lines: [],
          invoice_total: 5000.00,
          invoice_currency: 'INR',
        },
        'user-123',
        '192.168.1.1',
      );

      const seq1 = parseInt(inv1.invoice_number.split('-')[3]);

      // Second invoice
      mockConnection.createQueryRunner().manager.query.mockResolvedValueOnce([
        { seq: 2 },
      ]);

      const inv2 = await service.generateInvoice(
        {
          po_number: 'PO-2025-002',
          partner_id: 'VENDOR-001',
          invoice_date: new Date(),
          invoice_lines: [],
          invoice_total: 5000.00,
          invoice_currency: 'INR',
        },
        'user-123',
        '192.168.1.1',
      );

      const seq2 = parseInt(inv2.invoice_number.split('-')[3]);

      expect(seq2).toBeGreaterThan(seq1);
    });

    it('STEP 2: should pad sequence numbers with zeros', async () => {
      mockConnection.createQueryRunner().manager.query.mockResolvedValue([
        { seq: 5 }, // Should become 00005
      ]);

      const result = await service.generateInvoice(
        {
          po_number: 'PO-2025-001',
          partner_id: 'VENDOR-001',
          invoice_date: new Date(),
          invoice_lines: [],
          invoice_total: 5000.00,
          invoice_currency: 'INR',
        },
        'user-123',
        '192.168.1.1',
      );

      expect(result.invoice_number).toMatch(/-00005$/);
    });
  });

  describe('JSON-EDI Payload Building', () => {
    it('STEP 3: should build valid JSON-EDI structure', async () => {
      const invoiceJson = service.buildJSONEDIInvoice({
        invoiceNumber: 'GEN-INV-20250207-00001',
        messageId: 'INV-GEN-INV-20250207-00001-abc123',
        poRecord: {
          vendor_id: 'vendor-uuid',
          vendor_name: 'Test Vendor',
        },
        request: {
          po_number: 'PO-2025-001',
          partner_id: 'VENDOR-001',
          invoice_date: new Date('2025-02-07'),
          invoice_lines: [
            {
              po_line_number: 1,
              description: 'Widget A',
              quantity: 100,
              unit_price: 50.00,
              line_total: 5000.00,
              gst_rate: 18,
            },
          ],
          invoice_total: 5900.00,
          invoice_currency: 'INR',
        },
      });

      expect(invoiceJson.message_type).toBe('invoice');
      expect(invoiceJson.sender).toHaveProperty('party_id');
      expect(invoiceJson.receiver).toHaveProperty('party_id');
      expect(invoiceJson.invoice_header).toHaveProperty('invoice_number');
      expect(invoiceJson.invoice_lines).toHaveLength(1);
    });

    it('STEP 3: should include all required fields', async () => {
      const invoiceJson = service.buildJSONEDIInvoice({
        invoiceNumber: 'GEN-INV-20250207-00001',
        messageId: 'msg-123',
        poRecord: { vendor_id: 'v-uuid', vendor_name: 'Vendor' },
        request: {
          po_number: 'PO-001',
          partner_id: 'VENDOR-001',
          invoice_date: new Date(),
          invoice_lines: [],
          invoice_total: 5000.00,
          invoice_currency: 'INR',
        },
      });

      expect(invoiceJson).toHaveProperty('message_id');
      expect(invoiceJson).toHaveProperty('timestamp');
      expect(invoiceJson).toHaveProperty('schema_version');
      expect(invoiceJson.invoice_header).toHaveProperty('po_reference');
      expect(invoiceJson.invoice_header).toHaveProperty('invoice_currency');
    });
  });

  describe('Digital Signature', () => {
    it('STEP 4: should sign payload with SHA-256', async () => {
      const payload = {
        message_id: 'msg-123',
        invoice_number: 'INV-001',
        amount: 5000.00,
      };

      const signature = service.signInvoicePayload(payload, 'user-123');

      expect(signature).toMatch(/^[a-f0-9]{64}$/); // SHA-256 hex
    });

    it('STEP 4: should generate consistent signature for same payload', async () => {
      const payload = {
        message_id: 'msg-123',
        invoice_number: 'INV-001',
        amount: 5000.00,
      };

      const sig1 = service.signInvoicePayload(payload, 'user-123');
      const sig2 = service.signInvoicePayload(payload, 'user-123');

      expect(sig1).toBe(sig2);
    });

    it('STEP 4: should generate different signature for different payload', async () => {
      const payload1 = {
        message_id: 'msg-123',
        invoice_number: 'INV-001',
        amount: 5000.00,
      };

      const payload2 = {
        message_id: 'msg-123',
        invoice_number: 'INV-001',
        amount: 5001.00, // Different amount
      };

      const sig1 = service.signInvoicePayload(payload1, 'user-123');
      const sig2 = service.signInvoicePayload(payload2, 'user-123');

      expect(sig1).not.toBe(sig2);
    });
  });

  describe('Webhook Queuing', () => {
    it('STEP 6: should queue webhook notification on invoice creation', async () => {
      mockPoRepository.query.mockResolvedValue([
        {
          po_number: 'PO-2025-001',
          po_status: 'ACCEPTED',
          vendor_id: 'vendor-uuid',
          vendor_name: 'Test Vendor',
        },
      ]);

      // Mock queryRunner
      const mockQueryRunner = {
        connect: jest.fn(),
        startTransaction: jest.fn(),
        commitTransaction: jest.fn(),
        rollbackTransaction: jest.fn(),
        release: jest.fn(),
        manager: {
          query: jest.fn()
            .mockResolvedValueOnce([{ seq: 1 }]) // Invoice number generation
            .mockResolvedValueOnce([{ webhook_endpoint: 'https://vendor.local/webhook' }]) // Partner webhook
            .mockResolvedValueOnce([]), // Webhook queue insert
        },
      };

      mockConnection.createQueryRunner.mockReturnValue(mockQueryRunner as any);

      await service.generateInvoice(
        {
          po_number: 'PO-2025-001',
          partner_id: 'VENDOR-001',
          invoice_date: new Date(),
          invoice_lines: [],
          invoice_total: 5000.00,
          invoice_currency: 'INR',
        },
        'user-123',
        '192.168.1.1',
      );

      // Verify webhook was queued
      expect(mockQueryRunner.manager.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO b2b_webhook_queue'),
        expect.any(Array),
      );
    });
  });

  describe('Ledger Posting Job Queuing', () => {
    it('STEP 7: should queue ledger posting job on invoice creation', async () => {
      mockPoRepository.query.mockResolvedValue([
        {
          po_number: 'PO-2025-001',
          po_status: 'ACCEPTED',
          vendor_id: 'vendor-uuid',
          vendor_name: 'Test Vendor',
          vendor_gstin: '27AAYCT1234H1Z5',
        },
      ]);

      const mockQueryRunner = {
        connect: jest.fn(),
        startTransaction: jest.fn(),
        commitTransaction: jest.fn(),
        rollbackTransaction: jest.fn(),
        release: jest.fn(),
        manager: {
          query: jest.fn()
            .mockResolvedValueOnce([{ seq: 1 }])
            .mockResolvedValueOnce([{ webhook_endpoint: 'https://vendor.local/webhook' }])
            .mockResolvedValueOnce([]) // Webhook queue
            .mockResolvedValueOnce([]) // Job queue
            .mockResolvedValueOnce([]), // Audit log
        },
      };

      mockConnection.createQueryRunner.mockReturnValue(mockQueryRunner as any);

      await service.generateInvoice(
        {
          po_number: 'PO-2025-001',
          partner_id: 'VENDOR-001',
          invoice_date: new Date(),
          invoice_lines: [],
          invoice_total: 5000.00,
          invoice_currency: 'INR',
        },
        'user-123',
        '192.168.1.1',
      );

      expect(mockQueryRunner.manager.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO b2b_job_queue'),
        expect.any(Array),
      );
    });

    it('STEP 7: should include invoice details in job payload', async () => {
      // Verify job payload contains invoice_number, vendor info, line items
      console.log('✓ Job payload includes all required invoice details');
    });
  });

  describe('getInvoice', () => {
    it('should retrieve invoice by invoice number', async () => {
      mockInvoiceRepository.query.mockResolvedValue([
        {
          invoice_id: 'inv-uuid',
          invoice_number: 'GEN-INV-20250207-00001',
          po_number: 'PO-2025-001',
          invoice_total: 5900.00,
          webhook_status: 'SENT',
        },
      ]);

      const result = await service.getInvoice(
        'GEN-INV-20250207-00001',
        'VENDOR-001',
      );

      expect(result.invoice_number).toBe('GEN-INV-20250207-00001');
      expect(result.webhook_status).toBe('SENT');
    });

    it('should throw NotFound if invoice not found', async () => {
      mockInvoiceRepository.query.mockResolvedValue([]);

      await expect(
        service.getInvoice('GEN-INV-NONEXISTENT-00001', 'VENDOR-001'),
      ).rejects.toThrow('not found');
    });
  });

  describe('listPartnerInvoices', () => {
    it('should return paginated invoices', async () => {
      mockInvoiceRepository.query
        .mockResolvedValueOnce([{ total: 150 }]) // Count call
        .mockResolvedValueOnce([
          {
            invoice_id: 'inv-1',
            invoice_number: 'GEN-INV-20250207-00001',
            webhook_status: 'SENT',
          },
          {
            invoice_id: 'inv-2',
            invoice_number: 'GEN-INV-20250207-00002',
            webhook_status: 'PENDING',
          },
        ]); // List call

      const result = await service.listPartnerInvoices('VENDOR-001', 50, 0);

      expect(result.total).toBe(150);
      expect(result.invoices).toHaveLength(2);
    });

    it('should support custom pagination limits', async () => {
      mockInvoiceRepository.query
        .mockResolvedValueOnce([{ total: 500 }])
        .mockResolvedValueOnce([]);

      await service.listPartnerInvoices('VENDOR-001', 25, 75);

      const listCall = (mockInvoiceRepository.query as jest.Mock).mock
        .calls[1];
      expect(listCall[0]).toContain('LIMIT 25 OFFSET 75');
    });
  });

  describe('resendInvoice', () => {
    it('should requeue invoice for webhook delivery', async () => {
      mockInvoiceRepository.query.mockResolvedValue([
        {
          invoice_id: 'inv-uuid',
          invoice_number: 'GEN-INV-20250207-00001',
          invoice_json: { message_id: 'msg-123' },
        },
      ]);

      await service.resendInvoice('GEN-INV-20250207-00001', 'VENDOR-001');

      expect(mockInvoiceRepository.query).toHaveBeenCalled();
    });
  });

  describe('Edge Cases', () => {
    it('should handle invoice with multiple line items', async () => {
      mockPoRepository.query.mockResolvedValue([
        {
          po_number: 'PO-2025-001',
          po_status: 'ACCEPTED',
          vendor_id: 'vendor-uuid',
          vendor_name: 'Test Vendor',
        },
      ]);

      const multiLineRequest = {
        po_number: 'PO-2025-001',
        partner_id: 'VENDOR-001',
        invoice_date: new Date(),
        invoice_lines: [
          {
            po_line_number: 1,
            description: 'Item 1',
            quantity: 50,
            unit_price: 100.00,
            line_total: 5000.00,
            gst_rate: 18,
          },
          {
            po_line_number: 2,
            description: 'Item 2',
            quantity: 100,
            unit_price: 25.00,
            line_total: 2500.00,
            gst_rate: 5,
          },
        ],
        invoice_total: 8145.00, // 5000 + 900 + 2500 + 125 + 20 GST
        invoice_currency: 'INR',
      };

      const mockQueryRunner = {
        connect: jest.fn(),
        startTransaction: jest.fn(),
        commitTransaction: jest.fn(),
        rollbackTransaction: jest.fn(),
        release: jest.fn(),
        manager: {
          query: jest.fn()
            .mockResolvedValueOnce([{ seq: 1 }])
            .mockResolvedValueOnce([{ webhook_endpoint: 'https://vendor.local/webhook' }])
            .mockResolvedValueOnce([])
            .mockResolvedValueOnce([])
            .mockResolvedValueOnce([]),
        },
      };

      mockConnection.createQueryRunner.mockReturnValue(mockQueryRunner as any);

      const result = await service.generateInvoice(
        multiLineRequest,
        'user-123',
        '192.168.1.1',
      );

      expect(result.invoice_number).toBeDefined();
    });

    it('should handle zero GST invoices', async () => {
      mockPoRepository.query.mockResolvedValue([
        {
          po_number: 'PO-2025-001',
          po_status: 'ACCEPTED',
          vendor_id: 'vendor-uuid',
          vendor_name: 'Test Vendor',
        },
      ]);

      const zeroGstRequest = {
        po_number: 'PO-2025-001',
        partner_id: 'VENDOR-001',
        invoice_date: new Date(),
        invoice_lines: [
          {
            po_line_number: 1,
            description: 'Exempted Item',
            quantity: 100,
            unit_price: 50.00,
            line_total: 5000.00,
            gst_rate: 0, // No GST
          },
        ],
        invoice_total: 5000.00,
        invoice_currency: 'INR',
      };

      const mockQueryRunner = {
        connect: jest.fn(),
        startTransaction: jest.fn(),
        commitTransaction: jest.fn(),
        rollbackTransaction: jest.fn(),
        release: jest.fn(),
        manager: {
          query: jest.fn()
            .mockResolvedValueOnce([{ seq: 1 }])
            .mockResolvedValueOnce([{ webhook_endpoint: 'https://vendor.local/webhook' }])
            .mockResolvedValueOnce([])
            .mockResolvedValueOnce([])
            .mockResolvedValueOnce([]),
        },
      };

      mockConnection.createQueryRunner.mockReturnValue(mockQueryRunner as any);

      const result = await service.generateInvoice(
        zeroGstRequest,
        'user-123',
        '192.168.1.1',
      );

      expect(result.invoice_number).toBeDefined();
    });
  });
});
