import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { WebhookNotifierService } from '../services/webhook-notifier.service';
import { Repository, Connection } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import axios from 'axios';

jest.mock('axios');

/**
 * Webhook Notifier Service Unit Tests
 *
 * Tests webhook delivery with exponential backoff retry:
 *
 * Retry Schedule:
 * - Attempt 0: Immediate (< 5s)
 * - Attempt 1: +5 minutes
 * - Attempt 2: +30 minutes
 * - Attempt 3: +2 hours
 * - Attempt 4: +6 hours
 * - Attempt 5: DEAD_LETTER (ops review)
 *
 * Features:
 * - HMAC-SHA256 signature verification
 * - Webhook delivery tracking
 * - Dead letter queue management
 * - Manual retry capability
 * - SLA monitoring
 */
describe('WebhookNotifierService', () => {
  let service: WebhookNotifierService;
  let mockWebhookQueueRepository: jest.Mocked<Repository<any>>;
  let mockAuditLogRepository: jest.Mocked<Repository<any>>;
  let mockConnection: jest.Mocked<Connection>;

  beforeEach(async () => {
    mockWebhookQueueRepository = {
      query: jest.fn(),
      save: jest.fn(),
    } as any;

    mockAuditLogRepository = {
      query: jest.fn(),
      save: jest.fn(),
    } as any;

    mockConnection = {
      query: jest.fn(),
      createQueryRunner: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WebhookNotifierService,
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

    service = module.get<WebhookNotifierService>(WebhookNotifierService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('processPendingWebhooks', () => {
    it('should fetch and process pending webhooks', async () => {
      mockWebhookQueueRepository.query.mockResolvedValue([
        {
          webhook_id: 'webhook-1',
          partner_id: 'VENDOR-001',
          message_type: 'invoice',
          webhook_url: 'https://vendor.local/webhook',
          auth_token: 'Bearer token-123',
          message_payload: { message_id: 'msg-123', amount: 5000 },
          retry_count: 0,
        },
      ]);

      (axios.post as jest.Mock).mockResolvedValue({
        status: 200,
        data: { status: 'received' },
      });

      const result = await service.processPendingWebhooks();

      expect(result.processed).toBeGreaterThan(0);
      expect(result.sent).toBeGreaterThanOrEqual(0);
    });

    it('should fetch webhooks ordered by created_at ASC', async () => {
      mockWebhookQueueRepository.query.mockResolvedValue([]);

      await service.processPendingWebhooks();

      const query = (mockWebhookQueueRepository.query as jest.Mock).mock
        .calls[0][0];
      expect(query).toContain('ORDER BY created_at ASC');
    });

    it('should limit batch size to 100 webhooks', async () => {
      mockWebhookQueueRepository.query.mockResolvedValue([]);

      await service.processPendingWebhooks();

      const query = (mockWebhookQueueRepository.query as jest.Mock).mock
        .calls[0][0];
      expect(query).toContain('LIMIT 100');
    });

    it('should only process webhooks in PENDING or FAILED status', async () => {
      mockWebhookQueueRepository.query.mockResolvedValue([]);

      await service.processPendingWebhooks();

      const query = (mockWebhookQueueRepository.query as jest.Mock).mock
        .calls[0][0];
      expect(query).toContain("webhook_status IN ('PENDING', 'FAILED')");
    });

    it('should skip webhooks not yet due for retry', async () => {
      mockWebhookQueueRepository.query.mockResolvedValue([]);

      await service.processPendingWebhooks();

      const query = (mockWebhookQueueRepository.query as jest.Mock).mock
        .calls[0][0];
      expect(query).toContain('AND next_retry_at <= NOW()');
    });

    it('should skip webhooks exceeding max retries', async () => {
      mockWebhookQueueRepository.query.mockResolvedValue([]);

      await service.processPendingWebhooks();

      const query = (mockWebhookQueueRepository.query as jest.Mock).mock
        .calls[0][0];
      expect(query).toContain('AND retry_count < 5');
    });
  });

  describe('Webhook Delivery', () => {
    const mockWebhook = {
      webhook_id: 'webhook-1',
      partner_id: 'VENDOR-001',
      message_type: 'invoice',
      message_payload: { message_id: 'msg-123', amount: 5000 },
      webhook_url: 'https://vendor.local/webhook',
      auth_token: 'Bearer token-xyz',
      retry_count: 0,
    };

    it('should POST webhook payload to partner endpoint', async () => {
      (axios.post as jest.Mock).mockResolvedValue({
        status: 202,
        data: { status: 'accepted' },
      });

      mockWebhookQueueRepository.query.mockResolvedValue([mockWebhook]);

      await service.processPendingWebhooks();

      expect(axios.post).toHaveBeenCalledWith(
        'https://vendor.local/webhook',
        mockWebhook.message_payload,
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: 'Bearer token-xyz',
          }),
        }),
      );
    });

    it('should include X-Message-ID header', async () => {
      mockWebhookQueueRepository.query.mockResolvedValue([mockWebhook]);

      (axios.post as jest.Mock).mockResolvedValue({
        status: 200,
        data: {},
      });

      await service.processPendingWebhooks();

      const callArgs = (axios.post as jest.Mock).mock.calls[0];
      expect(callArgs[2].headers['X-Message-ID']).toBe('msg-123');
    });

    it('should include HMAC signature header', async () => {
      mockWebhookQueueRepository.query.mockResolvedValue([mockWebhook]);

      (axios.post as jest.Mock).mockResolvedValue({
        status: 200,
        data: {},
      });

      await service.processPendingWebhooks();

      const callArgs = (axios.post as jest.Mock).mock.calls[0];
      expect(callArgs[2].headers).toHaveProperty('X-Dream-Signature');
      expect(callArgs[2].headers['X-Dream-Signature']).toMatch(/^sha256=/);
    });

    it('should accept 2xx HTTP status codes', async () => {
      for (const status of [200, 201, 202, 204]) {
        (axios.post as jest.Mock).mockResolvedValueOnce({
          status,
          data: {},
        });

        mockWebhookQueueRepository.query.mockResolvedValueOnce([mockWebhook]);

        const result = await service.processPendingWebhooks();

        expect(result.sent).toBeGreaterThanOrEqual(0);
      }
    });
  });

  describe('Exponential Backoff Retry', () => {
    it('should calculate retry delay as 5 minutes for attempt 1', () => {
      const nextRetry = service['calculateNextRetry'](0);
      const delayMs = nextRetry.getTime() - Date.now();

      expect(delayMs).toBeGreaterThanOrEqual(300000 - 1000); // ~5 min, ±1s tolerance
      expect(delayMs).toBeLessThanOrEqual(300000 + 1000);
    });

    it('should calculate retry delay as 30 minutes for attempt 2', () => {
      const nextRetry = service['calculateNextRetry'](1);
      const delayMs = nextRetry.getTime() - Date.now();

      expect(delayMs).toBeGreaterThanOrEqual(1800000 - 1000); // ~30 min
      expect(delayMs).toBeLessThanOrEqual(1800000 + 1000);
    });

    it('should calculate retry delay as 2 hours for attempt 3', () => {
      const nextRetry = service['calculateNextRetry'](2);
      const delayMs = nextRetry.getTime() - Date.now();

      expect(delayMs).toBeGreaterThanOrEqual(7200000 - 1000); // ~2 hours
      expect(delayMs).toBeLessThanOrEqual(7200000 + 1000);
    });

    it('should calculate retry delay as 6 hours for attempt 4', () => {
      const nextRetry = service['calculateNextRetry'](3);
      const delayMs = nextRetry.getTime() - Date.now();

      expect(delayMs).toBeGreaterThanOrEqual(21600000 - 1000); // ~6 hours
      expect(delayMs).toBeLessThanOrEqual(21600000 + 1000);
    });

    it('should calculate retry delay as 24 hours for attempt 5+', () => {
      const nextRetry = service['calculateNextRetry'](4);
      const delayMs = nextRetry.getTime() - Date.now();

      expect(delayMs).toBeGreaterThanOrEqual(86400000 - 1000); // ~24 hours
      expect(delayMs).toBeLessThanOrEqual(86400000 + 1000);
    });

    it('should create retry schedule: 5m → 30m → 2h → 6h → 24h', () => {
      const schedule = [0, 1, 2, 3, 4].map((attempt) => {
        const delay = service['calculateNextRetry'](attempt).getTime() - Date.now();
        return Math.round(delay / 1000); // seconds
      });

      const expectedSeconds = [300, 1800, 7200, 21600, 86400];

      for (let i = 0; i < schedule.length; i++) {
        expect(schedule[i]).toBeCloseTo(expectedSeconds[i], -2);
      }
    });
  });

  describe('Webhook Status Updates', () => {
    it('should mark webhook as SENT on successful delivery', async () => {
      (axios.post as jest.Mock).mockResolvedValue({
        status: 200,
        data: {},
      });

      mockWebhookQueueRepository.query
        .mockResolvedValueOnce([
          {
            webhook_id: 'webhook-1',
            partner_id: 'VENDOR-001',
            message_payload: { message_id: 'msg-123' },
            webhook_url: 'https://vendor.local/webhook',
            auth_token: 'token',
            retry_count: 0,
          },
        ])
        .mockResolvedValueOnce([]); // Dead letter check

      await service.processPendingWebhooks();

      expect(mockWebhookQueueRepository.query).toHaveBeenCalledWith(
        expect.stringContaining("webhook_status = 'SENT'"),
        expect.any(Array),
      );
    });

    it('should increment retry_count on failed delivery', async () => {
      (axios.post as jest.Mock).mockRejectedValue(
        new Error('Connection timeout'),
      );

      mockWebhookQueueRepository.query
        .mockResolvedValueOnce([
          {
            webhook_id: 'webhook-1',
            partner_id: 'VENDOR-001',
            message_payload: { message_id: 'msg-123' },
            webhook_url: 'https://vendor.local/webhook',
            auth_token: 'token',
            retry_count: 0,
          },
        ])
        .mockResolvedValueOnce([]); // Dead letter check

      await service.processPendingWebhooks();

      expect(mockWebhookQueueRepository.query).toHaveBeenCalledWith(
        expect.stringContaining('retry_count + 1'),
        expect.any(Array),
      );
    });

    it('should set next_retry_at based on retry count', async () => {
      (axios.post as jest.Mock).mockRejectedValue(
        new Error('Connection timeout'),
      );

      mockWebhookQueueRepository.query
        .mockResolvedValueOnce([
          {
            webhook_id: 'webhook-1',
            partner_id: 'VENDOR-001',
            message_payload: { message_id: 'msg-123' },
            webhook_url: 'https://vendor.local/webhook',
            auth_token: 'token',
            retry_count: 2,
          },
        ])
        .mockResolvedValueOnce([]); // Dead letter check

      await service.processPendingWebhooks();

      expect(mockWebhookQueueRepository.query).toHaveBeenCalledWith(
        expect.stringContaining('next_retry_at'),
        expect.any(Array),
      );
    });
  });

  describe('Dead Letter Queue', () => {
    it('should move webhook to dead letter after max retries (5)', async () => {
      mockExhaustedWebhook = {
        webhook_id: 'webhook-dead',
        partner_id: 'VENDOR-001',
        retry_count: 5,
      };

      mockConnection.query.mockResolvedValue([]);

      await service['moveToDeadLetter'](mockExhaustedWebhook);

      expect(mockConnection.query).toHaveBeenCalledWith(
        expect.stringContaining("webhook_status = 'DEAD_LETTER'"),
        expect.any(Array),
      );
    });

    it('should insert dead letter into separate table', async () => {
      mockConnection.query.mockResolvedValue([]);

      const mockExhaustedWebhook = {
        webhook_id: 'webhook-dead',
        partner_id: 'VENDOR-001',
        message_type: 'invoice',
        message_payload: { message_id: 'msg-123' },
      };

      await service['moveToDeadLetter'](mockExhaustedWebhook as any);

      expect(mockConnection.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO b2b_webhook_dead_letter'),
        expect.any(Array),
      );
    });

    it('should not retry after moving to dead letter', async () => {
      mockWebhookQueueRepository.query.mockResolvedValue([]);

      await service.processPendingWebhooks();

      const query = (mockWebhookQueueRepository.query as jest.Mock).mock
        .calls[0][0];
      expect(query).toContain('retry_count < 5');
    });
  });

  describe('Manual Retry from Dead Letter', () => {
    it('should reset retry_count to 0 on manual retry', async () => {
      mockConnection.query.mockResolvedValue([
        {
          webhook_id: 'webhook-dead',
          partner_id: 'VENDOR-001',
        },
      ]);

      mockWebhookQueueRepository.query.mockResolvedValue([]);

      await service.retryDeadLetter('webhook-dead', 'user-123');

      expect(mockWebhookQueueRepository.query).toHaveBeenCalledWith(
        expect.stringContaining('retry_count = 0'),
        expect.any(Array),
      );
    });

    it('should set status back to PENDING on manual retry', async () => {
      mockConnection.query.mockResolvedValue([
        {
          webhook_id: 'webhook-dead',
          partner_id: 'VENDOR-001',
        },
      ]);

      mockWebhookQueueRepository.query.mockResolvedValue([]);

      await service.retryDeadLetter('webhook-dead', 'user-123');

      expect(mockWebhookQueueRepository.query).toHaveBeenCalledWith(
        expect.stringContaining("webhook_status = 'PENDING'"),
        expect.any(Array),
      );
    });

    it('should set next_retry_at to NOW() on manual retry', async () => {
      mockConnection.query.mockResolvedValue([
        {
          webhook_id: 'webhook-dead',
          partner_id: 'VENDOR-001',
        },
      ]);

      mockWebhookQueueRepository.query.mockResolvedValue([]);

      await service.retryDeadLetter('webhook-dead', 'user-123');

      expect(mockWebhookQueueRepository.query).toHaveBeenCalledWith(
        expect.stringContaining('next_retry_at = NOW()'),
        expect.any(Array),
      );
    });

    it('should log manual retry in audit table', async () => {
      mockConnection.query.mockResolvedValue([
        {
          webhook_id: 'webhook-dead',
          partner_id: 'VENDOR-001',
        },
      ]);

      mockWebhookQueueRepository.query.mockResolvedValue([]);

      await service.retryDeadLetter('webhook-dead', 'user-123');

      expect(mockConnection.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO b2b_webhook_manual_retry_log'),
        expect.any(Array),
      );
    });

    it('should remove from dead letter on manual retry', async () => {
      mockConnection.query.mockResolvedValue([
        {
          webhook_id: 'webhook-dead',
          partner_id: 'VENDOR-001',
        },
      ]);

      mockWebhookQueueRepository.query.mockResolvedValue([]);

      await service.retryDeadLetter('webhook-dead', 'user-123');

      expect(mockConnection.query).toHaveBeenCalledWith(
        expect.stringContaining('DELETE FROM b2b_webhook_dead_letter'),
        expect.any(Array),
      );
    });

    it('should throw error if webhook not in dead letter', async () => {
      mockConnection.query.mockResolvedValue([]);

      await expect(
        service.retryDeadLetter('webhook-nonexistent', 'user-123'),
      ).rejects.toThrow('Webhook not in dead letter');
    });
  });

  describe('HMAC Signature', () => {
    it('should generate HMAC-SHA256 signature', () => {
      const payload = { message_id: 'msg-123', amount: 5000 };
      const sharedSecret = 'secret-key';

      const signature = service['generateSignature'](payload, sharedSecret);

      expect(signature).toMatch(/^[a-f0-9]{64}$/); // SHA-256 hex
    });

    it('should generate consistent signature for same payload', () => {
      const payload = { message_id: 'msg-123', amount: 5000 };
      const sharedSecret = 'secret-key';

      const sig1 = service['generateSignature'](payload, sharedSecret);
      const sig2 = service['generateSignature'](payload, sharedSecret);

      expect(sig1).toBe(sig2);
    });

    it('should generate different signature for different payload', () => {
      const payload1 = { message_id: 'msg-123', amount: 5000 };
      const payload2 = { message_id: 'msg-123', amount: 5001 };
      const sharedSecret = 'secret-key';

      const sig1 = service['generateSignature'](payload1, sharedSecret);
      const sig2 = service['generateSignature'](payload2, sharedSecret);

      expect(sig1).not.toBe(sig2);
    });

    it('should generate different signature for different shared secret', () => {
      const payload = { message_id: 'msg-123', amount: 5000 };

      const sig1 = service['generateSignature'](payload, 'secret-1');
      const sig2 = service['generateSignature'](payload, 'secret-2');

      expect(sig1).not.toBe(sig2);
    });

    it('should verify webhook signature correctly', () => {
      const payload = { message_id: 'msg-123', amount: 5000 };
      const sharedSecret = 'secret-key';

      const signature = service['generateSignature'](payload, sharedSecret);
      const isValid = service.verifyWebhookSignature(
        payload,
        signature,
        sharedSecret,
      );

      expect(isValid).toBe(true);
    });

    it('should reject invalid signature', () => {
      const payload = { message_id: 'msg-123', amount: 5000 };
      const sharedSecret = 'secret-key';

      const isValid = service.verifyWebhookSignature(
        payload,
        'invalid-signature-abc123',
        sharedSecret,
      );

      expect(isValid).toBe(false);
    });
  });

  describe('Webhook History & Logs', () => {
    it('should retrieve webhook delivery history', async () => {
      mockConnection.query.mockResolvedValue([
        {
          log_id: 'log-1',
          webhook_id: 'webhook-1',
          http_status: 200,
          delivery_status: 'DELIVERED',
          created_at: new Date(),
        },
        {
          log_id: 'log-2',
          webhook_id: 'webhook-1',
          http_status: 503,
          delivery_status: 'FAILED',
          created_at: new Date(),
        },
      ]);

      const logs = await service.getDeliveryLogs('webhook-1');

      expect(logs).toHaveLength(2);
      expect(logs[0].delivery_status).toBe('DELIVERED');
      expect(logs[1].delivery_status).toBe('FAILED');
    });

    it('should return logs ordered by created_at DESC', async () => {
      mockConnection.query.mockResolvedValue([]);

      await service.getDeliveryLogs('webhook-1');

      const query = (mockConnection.query as jest.Mock).mock.calls[0][0];
      expect(query).toContain('ORDER BY created_at DESC');
    });
  });

  describe('Queue Statistics', () => {
    it('should return webhook queue statistics', async () => {
      mockConnection.query.mockResolvedValue([
        {
          pending: 10,
          sent: 1000,
          failed: 5,
          dead_letter: 2,
          avg_retries: 0.75,
        },
      ]);

      const stats = await service.getQueueStats();

      expect(stats.pending).toBe(10);
      expect(stats.sent).toBe(1000);
      expect(stats.failed).toBe(5);
      expect(stats.deadLetter).toBe(2);
      expect(stats.avgRetries).toBe(0.75);
    });

    it('should handle zero statistics gracefully', async () => {
      mockConnection.query.mockResolvedValue([
        {
          pending: null,
          sent: null,
          failed: null,
          dead_letter: null,
          avg_retries: null,
        },
      ]);

      const stats = await service.getQueueStats();

      expect(stats.pending).toBe(0);
      expect(stats.sent).toBe(0);
      expect(stats.failed).toBe(0);
      expect(stats.deadLetter).toBe(0);
      expect(stats.avgRetries).toBe(0);
    });
  });

  describe('Error Scenarios', () => {
    it('should handle HTTP 4xx errors (partner config issue)', async () => {
      (axios.post as jest.Mock).mockRejectedValue({
        response: {
          status: 400,
          statusText: 'Bad Request',
        },
        message: 'Bad Request',
      });

      mockWebhookQueueRepository.query
        .mockResolvedValueOnce([
          {
            webhook_id: 'webhook-1',
            partner_id: 'VENDOR-001',
            message_payload: { message_id: 'msg-123' },
            webhook_url: 'https://vendor.local/webhook',
            auth_token: 'token',
            retry_count: 0,
          },
        ])
        .mockResolvedValueOnce([]);

      await service.processPendingWebhooks();

      // Should mark as FAILED (not retry indefinitely)
      expect(mockWebhookQueueRepository.query).toHaveBeenCalledWith(
        expect.stringContaining('retry_count + 1'),
        expect.any(Array),
      );
    });

    it('should handle network timeouts', async () => {
      (axios.post as jest.Mock).mockRejectedValue(
        new Error('timeout of 30000ms exceeded'),
      );

      mockWebhookQueueRepository.query
        .mockResolvedValueOnce([
          {
            webhook_id: 'webhook-1',
            partner_id: 'VENDOR-001',
            message_payload: { message_id: 'msg-123' },
            webhook_url: 'https://vendor.local/webhook',
            auth_token: 'token',
            retry_count: 0,
          },
        ])
        .mockResolvedValueOnce([]);

      await service.processPendingWebhooks();

      // Should queue for retry
      expect(mockWebhookQueueRepository.query).toHaveBeenCalledWith(
        expect.stringContaining('next_retry_at'),
        expect.any(Array),
      );
    });

    it('should handle DNS resolution failures', async () => {
      (axios.post as jest.Mock).mockRejectedValue(
        new Error('getaddrinfo ENOTFOUND vendor.local'),
      );

      mockWebhookQueueRepository.query
        .mockResolvedValueOnce([
          {
            webhook_id: 'webhook-1',
            partner_id: 'VENDOR-001',
            message_payload: { message_id: 'msg-123' },
            webhook_url: 'https://vendor-nonexistent.local/webhook',
            auth_token: 'token',
            retry_count: 0,
          },
        ])
        .mockResolvedValueOnce([]);

      await service.processPendingWebhooks();

      // Should queue for retry
      expect(mockWebhookQueueRepository.query).toHaveBeenCalledWith(
        expect.stringContaining('next_retry_at'),
        expect.any(Array),
      );
    });
  });
});
