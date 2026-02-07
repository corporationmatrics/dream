import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, ConflictException } from '@nestjs/common';
import { POIntakeService } from '../services/po-intake.service';
import { Repository, Connection } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';

/**
 * PO Intake Service Unit Tests
 *
 * Tests the 9-step PO intake workflow:
 * 1. JSON schema validation
 * 2. Partner authentication & status check
 * 3. Duplicate PO detection
 * 4. Inventory availability check
 * 5. B2B PO record creation
 * 6. PO line items creation
 * 7. Map to internal order
 * 8. Queue webhook notification
 * 9. Audit trail logging
 *
 * Edge cases:
 * - Duplicate PO submission
 * - Inactive partner
 * - Inventory shortage
 * - Missing required fields
 */
describe('POIntakeService', () => {
  let service: POIntakeService;
  let mockPoRepository: jest.Mocked<Repository<any>>;
  let mockPartnerRepository: jest.Mocked<Repository<any>>;
  let mockInventoryRepository: jest.Mocked<Repository<any>>;
  let mockConnection: jest.Mocked<Connection>;

  beforeEach(async () => {
    // Mock repositories
    mockPoRepository = {
      query: jest.fn(),
      save: jest.fn(),
      findOne: jest.fn(),
    } as any;

    mockPartnerRepository = {
      query: jest.fn(),
      findOne: jest.fn(),
    } as any;

    mockInventoryRepository = {
      query: jest.fn(),
    } as any;

    mockConnection = {
      createQueryRunner: jest.fn(),
      query: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        POIntakeService,
        {
          provide: getRepositoryToken('B2bPurchaseOrder'),
          useValue: mockPoRepository,
        },
        {
          provide: getRepositoryToken('B2bPartner'),
          useValue: mockPartnerRepository,
        },
        {
          provide: getRepositoryToken('ProductInventory'),
          useValue: mockInventoryRepository,
        },
        {
          provide: Connection,
          useValue: mockConnection,
        },
      ],
    }).compile();

    service = module.get<POIntakeService>(POIntakeService);
  });

  describe('processPurchaseOrder - Main Workflow', () => {
    const validPORequest = {
      message_type: 'purchase_order',
      sender: {
        party_id: 'VENDOR-001',
        party_name: 'Acme Corp',
      },
      po_header: {
        po_number: 'PO-2025-001',
        po_date: '2025-02-07',
      },
      po_lines: [
        {
          po_line_number: 1,
          product_id: 'PROD-001',
          quantity: 100,
          unit_price: 50.00,
        },
      ],
    };

    it('STEP 1: should validate JSON schema', async () => {
      // Invalid: missing po_header
      const invalidPO = {
        message_type: 'purchase_order',
        sender: { party_id: 'VENDOR-001' },
      };

      expect(() => {
        service.validatePOSchema(invalidPO);
      }).toThrow('po_header is required');
    });

    it('STEP 1: should reject invalid message type', async () => {
      const invalidPO = {
        ...validPORequest,
        message_type: 'invalid_message',
      };

      expect(() => {
        service.validatePOSchema(invalidPO);
      }).toThrow('message_type must be purchase_order');
    });

    it('STEP 2: should authenticate partner', async () => {
      mockPartnerRepository.query.mockResolvedValue([
        {
          id: 'partner-uuid',
          party_id: 'VENDOR-001',
          integration_status: 'PRODUCTION',
          rate_limit_per_minute: 100,
        },
      ]);

      const result = await service.authenticatePartner('VENDOR-001');
      expect(result).toHaveProperty('id');
      expect(result.integration_status).toBe('PRODUCTION');
    });

    it('STEP 2: should reject inactive partner', async () => {
      mockPartnerRepository.query.mockResolvedValue([
        {
          id: 'partner-uuid',
          party_id: 'VENDOR-001',
          integration_status: 'PENDING', // Not PRODUCTION
        },
      ]);

      await expect(service.authenticatePartner('VENDOR-001')).rejects.toThrow(
        'Partner not activated',
      );
    });

    it('STEP 2: should reject unknown partner', async () => {
      mockPartnerRepository.query.mockResolvedValue([]);

      await expect(service.authenticatePartner('VENDOR-UNKNOWN')).rejects.toThrow(
        'Partner not found',
      );
    });

    it('STEP 3: should detect duplicate POs', async () => {
      mockPoRepository.query.mockResolvedValue([
        {
          po_number: 'PO-2025-001',
          partner_id: 'VENDOR-001',
          created_at: new Date(),
        },
      ]);

      await expect(
        service.checkDuplicatePO('PO-2025-001', 'VENDOR-001'),
      ).rejects.toThrow(ConflictException);
    });

    it('STEP 3: should allow new PO', async () => {
      mockPoRepository.query.mockResolvedValue([]);

      const result = await service.checkDuplicatePO('PO-2025-NEW', 'VENDOR-001');
      expect(result).toBeUndefined(); // No exception
    });

    it('STEP 4: should validate inventory availability', async () => {
      mockInventoryRepository.query.mockResolvedValue([
        {
          product_id: 'PROD-001',
          available_qty: 500,
        },
      ]);

      const result = await service.validateInventory([
        {
          product_id: 'PROD-001',
          quantity: 100,
        },
      ]);

      expect(result).toBeUndefined();
    });

    it('STEP 4: should reject if inventory insufficient', async () => {
      mockInventoryRepository.query.mockResolvedValue([
        {
          product_id: 'PROD-001',
          available_qty: 50,
        },
      ]);

      await expect(
        service.validateInventory([
          {
            product_id: 'PROD-001',
            quantity: 100,
          },
        ]),
      ).rejects.toThrow('Insufficient inventory');
    });

    it('STEP 4: should reject if product not found', async () => {
      mockInventoryRepository.query.mockResolvedValue([]);

      await expect(
        service.validateInventory([
          {
            product_id: 'PROD-UNKNOWN',
            quantity: 100,
          },
        ]),
      ).rejects.toThrow('Product not found');
    });
  });

  describe('Edge Cases - Duplicates', () => {
    it('should reject duplicate PO with same po_number from same partner', async () => {
      mockPoRepository.query.mockResolvedValue([
        {
          po_number: 'PO-DUP-001',
          partner_id: 'vendor-uuid',
        },
      ]);

      await expect(
        service.checkDuplicatePO('PO-DUP-001', 'VENDOR-001'),
      ).rejects.toThrow('already exists');
    });

    it('should allow same po_number from different partner', async () => {
      mockPoRepository.query.mockResolvedValue([]); // First partner's PO not found

      const result = await service.checkDuplicatePO('PO-001', 'VENDOR-002');
      expect(result).toBeUndefined();
    });

    it('should match po_number case-insensitively', async () => {
      mockPoRepository.query.mockResolvedValue([
        {
          po_number: 'po-2025-001', // lowercase
        },
      ]);

      // When searching for uppercase version
      await expect(
        service.checkDuplicatePO('PO-2025-001', 'VENDOR-001'),
      ).rejects.toThrow();
    });
  });

  describe('Edge Cases - Inventory', () => {
    it('should handle negative inventory gracefully', async () => {
      mockInventoryRepository.query.mockResolvedValue([
        {
          product_id: 'PROD-001',
          available_qty: -10, // Negative stock
        },
      ]);

      await expect(
        service.validateInventory([
          {
            product_id: 'PROD-001',
            quantity: 1,
          },
        ]),
      ).rejects.toThrow('Insufficient inventory');
    });

    it('should allow 0 quantity request', async () => {
      mockInventoryRepository.query.mockResolvedValue([
        {
          product_id: 'PROD-001',
          available_qty: 100,
        },
      ]);

      const result = await service.validateInventory([
        {
          product_id: 'PROD-001',
          quantity: 0,
        },
      ]);

      expect(result).toBeUndefined();
    });

    it('should check multiple line items', async () => {
      mockInventoryRepository.query.mockResolvedValue([
        { product_id: 'PROD-001', available_qty: 100 },
        { product_id: 'PROD-002', available_qty: 50 },
        { product_id: 'PROD-003', available_qty: 0 }, // Out of stock
      ]);

      await expect(
        service.validateInventory([
          { product_id: 'PROD-001', quantity: 50 },
          { product_id: 'PROD-002', quantity: 25 },
          { product_id: 'PROD-003', quantity: 1 },
        ]),
      ).rejects.toThrow('Insufficient inventory');
    });
  });

  describe('PO Line Item Processing', () => {
    it('should create PO line items with correct mapping', async () => {
      const poLines = [
        {
          po_line_number: 1,
          product_id: 'PROD-001',
          quantity: 100,
          unit_price: 50.00,
        },
        {
          po_line_number: 2,
          product_id: 'PROD-002',
          quantity: 50,
          unit_price: 75.00,
        },
      ];

      const result = await service.createPOLineItems('po-uuid', poLines);

      expect(result).toHaveLength(2);
      expect(result[0].po_line_number).toBe(1);
      expect(result[1].po_line_number).toBe(2);
    });

    it('should map PO lines to internal products', async () => {
      const poLine = {
        po_line_number: 1,
        product_id: 'VENDOR-SKU-001',
        quantity: 100,
        unit_price: 50.00,
      };

      const internalMapping = await service.mapToInternalProduct('VENDOR-001', poLine);

      expect(internalMapping).toHaveProperty('internal_product_id');
      expect(internalMapping).toHaveProperty('gst_rate');
    });

    it('should reject line item with invalid quantity', async () => {
      const invalidLine = {
        po_line_number: 1,
        product_id: 'PROD-001',
        quantity: -10, // Negative quantity
        unit_price: 50.00,
      };

      expect(() => {
        service.validateLineItem(invalidLine);
      }).toThrow('quantity must be positive');
    });

    it('should reject line item with invalid price', async () => {
      const invalidLine = {
        po_line_number: 1,
        product_id: 'PROD-001',
        quantity: 100,
        unit_price: -50.00, // Negative price
      };

      expect(() => {
        service.validateLineItem(invalidLine);
      }).toThrow('unit_price must be positive');
    });
  });

  describe('Partner Rate Limiting', () => {
    it('should enforce rate limit (100 POs per minute)', async () => {
      const partner = {
        rate_limit_per_minute: 100,
        last_po_submitted_at: new Date(Date.now() - 5 * 1000), // 5 seconds ago
      };

      // Simulate 100 POs in the last minute
      mockPoRepository.query.mockResolvedValue(
        Array(100).fill({ po_number: 'PO-001' }),
      );

      await expect(
        service.checkRateLimit(partner),
      ).rejects.toThrow('Rate limit exceeded');
    });

    it('should allow POs under rate limit', async () => {
      const partner = {
        rate_limit_per_minute: 100,
      };

      mockPoRepository.query.mockResolvedValue(
        Array(50).fill({ po_number: 'PO-001' }),
      );

      const result = await service.checkRateLimit(partner);
      expect(result).toBeUndefined();
    });
  });

  describe('Audit Trail & Logging', () => {
    it('should create audit log entry on PO submission', async () => {
      const auditEntry = {
        partner_id: 'vendor-uuid',
        edi_message_id: 'msg-123',
        message_type: 'purchase_order',
        direction: 'INBOUND',
        processing_status: 'RECEIVED',
        user_id: 'user-uuid',
        client_ip: '192.168.1.1',
      };

      await service.createAuditLog(auditEntry);

      expect(mockConnection.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO b2b_edi_audit_log'),
        expect.any(Array),
      );
    });

    it('should include user_id and client_ip in audit', async () => {
      const userId = 'user-123';
      const clientIp = '10.0.0.5';

      const auditEntry = {
        partner_id: 'vendor-uuid',
        edi_message_id: 'msg-456',
        message_type: 'purchase_order',
        direction: 'INBOUND',
        user_id: userId,
        client_ip: clientIp,
      };

      await service.createAuditLog(auditEntry);

      const callArgs = (mockConnection.query as jest.Mock).mock.calls[0];
      expect(callArgs[1]).toContain(userId);
      expect(callArgs[1]).toContain(clientIp);
    });
  });

  describe('Error Handling & Logging', () => {
    it('should throw BadRequestException for validation errors', async () => {
      const invalidPO = {
        message_type: 'purchase_order',
        // Missing required fields
      };

      await expect(
        service.processPurchaseOrder(invalidPO, '192.168.1.1', 'user-123'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should include error details in response', async () => {
      const invalidPO = {
        message_type: 'purchase_order',
      };

      try {
        await service.processPurchaseOrder(invalidPO, '192.168.1.1', 'user-123');
      } catch (error) {
        expect(error.response).toHaveProperty('error_code');
        expect(error.response).toHaveProperty('message');
      }
    });
  });

  describe('getPOStatus', () => {
    it('should retrieve PO with status and line items', async () => {
      mockPoRepository.query.mockResolvedValue([
        {
          po_number: 'PO-001',
          po_status: 'ACCEPTED',
          po_date: '2025-02-07',
          po_lines: [
            {
              po_line_number: 1,
              product_id: 'PROD-001',
              quantity: 100,
            },
          ],
        },
      ]);

      const result = await service.getPOStatus('VENDOR-001', 'PO-001');

      expect(result.po_number).toBe('PO-001');
      expect(result.po_status).toBe('ACCEPTED');
      expect(result.po_lines).toHaveLength(1);
    });

    it('should throw not found for non-existent PO', async () => {
      mockPoRepository.query.mockResolvedValue([]);

      await expect(
        service.getPOStatus('VENDOR-001', 'PO-NONEXISTENT'),
      ).rejects.toThrow('not found');
    });
  });

  describe('listPartnerPOs', () => {
    it('should return paginated list of partner POs', async () => {
      mockPoRepository.query.mockResolvedValue([
        { po_number: 'PO-001', po_status: 'ACCEPTED' },
        { po_number: 'PO-002', po_status: 'PARTIAL' },
      ]);

      const result = await service.listPartnerPOs('VENDOR-001', 50, 0);

      expect(result.total).toBeGreaterThan(0);
      expect(result.pos).toHaveLength(2);
    });

    it('should support limit and offset', async () => {
      mockPoRepository.query.mockResolvedValue([]);

      await service.listPartnerPOs('VENDOR-001', 10, 20);

      const callArgs = (mockPoRepository.query as jest.Mock).mock.calls[0];
      expect(callArgs[0]).toContain('LIMIT 10 OFFSET 20');
    });
  });
});
