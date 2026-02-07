# JSON-EDI Protocol Design Document
**Version:** 1.0  
**Status:** Phase 1.5 (Months 5-6)  
**Date:** February 7, 2026

---

## 1. Executive Summary

**Purpose:** Enable zero-manual B2B document exchange for Purchase Orders (PO) → Invoices → Ledger entries.

**Key Features:**
- JSON-based EDI (simpler than XML, REST-native)
- Real-time webhook callbacks for status updates
- Saga pattern for distributed transaction handling
- Immutable audit trail for compliance

**Business Flow:**
```
B2B Partner System
    ↓ (POST /api/b2b/purchase-orders)
Dream ERP Platform
    ↓
    Create Purchase Order (NestJS)
    ↓
    Auto-generate order (matching with inventory)
    ↓
    Confirm receipt to B2B partner (webhook)
    ↓
    Upon completion: Generate Invoice
    ↓
    Post to Accounting (Spring Boot)
    ↓
    Webhook: Invoice JSON sent back to partner
    ↓
B2B Partner auto-receives and auto-posts to their GL
```

---

## 2. JSON-EDI Message Formats

### **2.1 Purchase Order (PO) Message**

```json
{
  "message_type": "purchase_order",
  "message_version": "1.0",
  "timestamp": "2026-02-07T10:30:00Z",
  "sender": {
    "party_id": "B2B_PARTNER_001",
    "party_name": "Acme Corp",
    "contact_email": "procurement@acme.com",
    "webhook_url": "https://acme.com/api/webhooks/erp"
  },
  "receiver": {
    "party_id": "DREAM_ERP_001",
    "party_name": "Dream Platform"
  },
  
  "po_header": {
    "po_number": "PO-2026-001234",
    "po_date": "2026-02-07",
    "delivery_date": "2026-02-15",
    "currency": "INR",
    "po_status": "NEW",
    
    "billing_address": {
      "street": "123 Business Ave",
      "city": "Bangalore",
      "state": "KA",
      "country": "IN",
      "postal_code": "560001"
    },
    
    "delivery_address": {
      "street": "456 Warehouse St",
      "city": "Bangalore",
      "state": "KA",
      "country": "IN",
      "postal_code": "560002"
    },
    
    "payment_terms": {
      "type": "NET_30",
      "discount_percentage": 2.5,
      "early_payment_date": "2026-02-22"
    }
  },
  
  "po_lines": [
    {
      "line_number": 1,
      "product_id": "SKU-12345",
      "product_name": "Industrial Widget",
      "qty": 100,
      "unit": "PCS",
      "unit_price": 150.00,
      "line_total": 15000.00,
      "tax_rate": 0.18,
      "tax_amount": 2700.00,
      "delivery_date": "2026-02-15",
      "special_instructions": "Mark boxes with PO number"
    },
    {
      "line_number": 2,
      "product_id": "SKU-67890",
      "product_name": "Premium Component",
      "qty": 50,
      "unit": "BOX",
      "unit_price": 500.00,
      "line_total": 25000.00,
      "tax_rate": 0.18,
      "tax_amount": 4500.00,
      "delivery_date": "2026-02-15"
    }
  ],
  
  "po_summary": {
    "subtotal": 40000.00,
    "tax_total": 7200.00,
    "shipping_charges": 0.00,
    "grand_total": 47200.00
  },
  
  "meta": {
    "message_id": "MSG-2026-0001-001234",
    "correlation_id": "CORR-B2B-ACME-001",
    "retry_count": 0,
    "digital_signature": "SHA256:abcd1234efgh5678"
  }
}
```

---

### **2.2 Purchase Order Acknowledgment (POA)**

```json
{
  "message_type": "purchase_order_acknowledgment",
  "message_version": "1.0",
  "timestamp": "2026-02-07T10:35:12Z",
  
  "reference": {
    "po_number": "PO-2026-001234",
    "message_id": "MSG-2026-0001-001234",
    "correlation_id": "CORR-B2B-ACME-001"
  },
  
  "acknowledgment": {
    "status": "ACKNOWLEDGED",
    "internal_order_id": "ORD-2026-100234",
    "acknowledgment_date": "2026-02-07T10:35:00Z",
    "estimated_ship_date": "2026-02-14",
    "acknowledgment_message": "PO received and confirmed. All items in stock."
  },
  
  "line_confirmations": [
    {
      "line_number": 1,
      "qty_confirmed": 100,
      "qty_backorder": 0,
      "ship_date": "2026-02-14"
    },
    {
      "line_number": 2,
      "qty_confirmed": 50,
      "qty_backorder": 0,
      "ship_date": "2026-02-14"
    }
  ],
  
  "meta": {
    "message_id": "MSG-2026-0001-001234-ACK",
    "correlation_id": "CORR-B2B-ACME-001"
  }
}
```

---

### **2.3 Invoice Message**

```json
{
  "message_type": "invoice",
  "message_version": "1.0",
  "timestamp": "2026-02-14T16:20:00Z",
  
  "sender": {
    "party_id": "DREAM_ERP_001",
    "party_name": "Dream Platform"
  },
  
  "receiver": {
    "party_id": "B2B_PARTNER_001",
    "party_name": "Acme Corp",
    "webhook_url": "https://acme.com/api/webhooks/erp"
  },
  
  "invoice_header": {
    "invoice_number": "INV-2026-005678",
    "invoice_date": "2026-02-14",
    "po_reference": "PO-2026-001234",
    "internal_order_id": "ORD-2026-100234",
    "invoice_status": "ISSUED",
    "payment_due_date": "2026-03-16",
    "currency": "INR",
    
    "shipping_details": {
      "ship_date": "2026-02-14",
      "carrier": "XYZ Logistics",
      "tracking_number": "TRK-2026-123456",
      "delivery_date": "2026-02-15"
    }
  },
  
  "invoice_lines": [
    {
      "line_number": 1,
      "po_line": 1,
      "product_id": "SKU-12345",
      "product_name": "Industrial Widget",
      "qty_shipped": 100,
      "unit": "PCS",
      "unit_price": 150.00,
      "line_total": 15000.00,
      "tax_rate": 0.18,
      "tax_amount": 2700.00
    },
    {
      "line_number": 2,
      "po_line": 2,
      "product_id": "SKU-67890",
      "product_name": "Premium Component",
      "qty_shipped": 50,
      "unit": "BOX",
      "unit_price": 500.00,
      "line_total": 25000.00,
      "tax_rate": 0.18,
      "tax_amount": 4500.00
    }
  ],
  
  "invoice_charges": [
    {
      "charge_type": "FREIGHT",
      "charge_description": "Standard shipping",
      "charge_amount": 0.00
    }
  ],
  
  "invoice_summary": {
    "subtotal": 40000.00,
    "tax_total": 7200.00,
    "charges_total": 0.00,
    "invoice_total": 47200.00,
    "amount_paid": 0.00,
    "amount_due": 47200.00
  },
  
  "payment_terms": {
    "terms_code": "NET_30",
    "early_payment_discount": {
      "discount_percentage": 2.5,
      "discount_days": 8,
      "discount_amount": 1180.00
    }
  },
  
  "tax_details": {
    "hsn_summary": [
      {
        "hsn_code": "84321000",
        "tax_rate": 0.18,
        "taxable_amount": 15000,
        "tax_amount": 2700
      }
    ],
    "gst_references": {
      "seller_gstin": "27AAACR1234H1Z0",
      "buyer_gstin": "09AAACR1234H1Z1"
    }
  },
  
  "meta": {
    "message_id": "MSG-2026-0001-005678-INV",
    "correlation_id": "CORR-B2B-ACME-001",
    "digital_signature": "SHA256:ijkl9012mnop3456"
  }
}
```

---

### **2.4 Ledger Entry Message (Internal)**

```json
{
  "message_type": "ledger_entry",
  "message_version": "1.0",
  "timestamp": "2026-02-14T16:25:00Z",
  
  "transaction_header": {
    "transaction_id": "TXN-2026-001234",
    "invoice_reference": "INV-2026-005678",
    "po_reference": "PO-2026-001234",
    "transaction_date": "2026-02-14",
    "transaction_type": "PURCHASE_INVOICE"
  },
  
  "ledger_entries": [
    {
      "entry_number": 1,
      "account_code": "2010",
      "account_name": "Accounts Payable - Acme Corp",
      "debit": 0,
      "credit": 47200.00,
      "description": "Invoice INV-2026-005678"
    },
    {
      "entry_number": 2,
      "account_code": "4110",
      "account_name": "Raw Materials / Inventory",
      "debit": 40000.00,
      "credit": 0,
      "description": "Purchase of goods - SKU-12345, SKU-67890"
    },
    {
      "entry_number": 3,
      "account_code": "5120",
      "account_name": "Input GST",
      "debit": 7200.00,
      "credit": 0,
      "description": "GST on purchase - INV-2026-005678"
    }
  ],
  
  "validation": {
    "debit_total": 47200.00,
    "credit_total": 47200.00,
    "balanced": true
  },
  
  "meta": {
    "transaction_id": "TXN-2026-001234",
    "posted_by": "B2B_AUTOMATION",
    "posting_date": "2026-02-14T16:25:00Z"
  }
}
```

---

## 3. API Endpoints

### **3.1 Inbound EDI Endpoints (Dream ERP receives from B2B)**

| Endpoint | Method | Body | Purpose |
|----------|--------|------|---------|
| `/api/b2b/purchase-orders` | POST | PO JSON | Receive purchase order |
| `/api/b2b/purchase-orders/{po_id}/acknowledge` | POST | POA JSON | Acknowledge PO |
| `/api/b2b/orders/{order_id}/update-status` | PATCH | Status JSON | Track shipment status |

### **3.2 Outbound Webhook Endpoints (Dream ERP sends to B2B)**

```
B2B Partner configures webhook URL:
  https://partner.com/api/webhooks/erp

Dream ERP calls:
  POST https://partner.com/api/webhooks/erp
  Body: {
    "event": "po.acknowledged",
    "data": { POA_JSON }
  }

Events:
  - po.received
  - po.acknowledged
  - po.rejected
  - order.shipped
  - order.delivered
  - invoice.issued
  - payment.received
```

---

## 4. Implementation Architecture

### **NestJS B2B Sync Module**

```
src/
├── b2b-sync/
│   ├── b2b-sync.module.ts
│   ├── controllers/
│   │   ├── purchase-order.controller.ts         # POST /api/b2b/purchase-orders
│   │   ├── po-ack.controller.ts                 # POST /api/b2b/acknowledge
│   │   └── webhook.controller.ts                # Webhooks from B2B partners
│   ├── services/
│   │   ├── po-intake.service.ts                 # Parse & validate PO
│   │   ├── po-mapper.service.ts                 # Map PO → Internal Order
│   │   ├── invoice-generator.service.ts         # Create Invoice JSON-EDI
│   │   ├── webhook-notifier.service.ts          # Send callbacks to B2B
│   │   └── edi-validator.service.ts             # JSON schema validation
│   ├── entities/
│   │   ├── b2b-order.entity.ts                  # Maps to orders table
│   │   ├── edi-message.entity.ts                # Audit trail
│   │   └── b2b-partner.entity.ts                # Partner config
│   ├── dtos/
│   │   ├── po-intake.dto.ts
│   │   ├── invoice-output.dto.ts
│   │   └── webhook-payload.dto.ts
│   └── schemas/
│       ├── po.schema.json                       # JSON schema for validation
│       └── invoice.schema.json

// Example: PO Intake Service
@Injectable()
export class POIntakeService {
  async processPurchaseOrder(poJson: any): Promise<Order> {
    // 1. Validate against schema
    await this.validator.validate(poJson, 'po.schema.json');
    
    // 2. Check B2B partner credentials
    const partner = await this.partnerService.getPartner(poJson.sender.party_id);
    
    // 3. Map PO JSON to internal Order
    const order = this.mapper.mapPOToOrder(poJson, partner);
    
    // 4. Create order in system
    const savedOrder = await this.orderService.create(order);
    
    // 5. Trigger acknowledgment webhook
    await this.webhookNotifier.sendPOAcknowledgment(poJson, savedOrder);
    
    // 6. Audit trail
    await this.auditService.log('PO_RECEIVED', poJson, savedOrder);
    
    return savedOrder;
  }
}
```

### **Spring Boot: Ledger Post from Invoice**

```java
@RestController
@RequestMapping("/api/accounting/invoices")
public class InvoicePostingController {
    
    @PostMapping("/post-from-edi")
    public ResponseEntity<?> postInvoiceToLedger(
        @RequestBody InvoiceEDIDto invoiceDto
    ) {
        // 1. Create AP liability entry
        LedgerEntry apEntry = new LedgerEntry()
            .setAccount("2010") // Accounts Payable
            .setCredit(invoiceDto.getInvoiceTotal());
        
        // 2. Create inventory entry
        LedgerEntry inventoryEntry = new LedgerEntry()
            .setAccount("4110") // Raw Materials
            .setDebit(invoiceDto.getSubtotal());
        
        // 3. Create GST input entry
        LedgerEntry gstEntry = new LedgerEntry()
            .setAccount("5120") // Input GST
            .setDebit(invoiceDto.getTaxTotal());
        
        // 4. Validate balance (debit = credit)
        double totalDebit = inventoryEntry.getDebit() + gstEntry.getDebit();
        double totalCredit = apEntry.getCredit();
        
        if (totalDebit != totalCredit) {
            throw new LedgerImbalanceException();
        }
        
        // 5. Post to ledger (atomic)
        Transaction txn = ledgerService.postTransaction(
            List.of(apEntry, inventoryEntry, gstEntry)
        );
        
        return ResponseEntity.ok(txn);
    }
}
```

---

## 5. Error Handling & Retry Strategy

### **5.1 Validation Errors (reject PO immediately)**

```json
{
  "message_type": "error_response",
  "error_code": "PO_VALIDATION_FAILED",
  "error_details": [
    {
      "field": "po_lines[0].qty",
      "error": "Quantity exceeds inventory. Available: 95, Requested: 100"
    }
  ],
  "correlation_id": "CORR-B2B-ACME-001"
}
```

### **5.2 Delivery Confirmation & Retry**

```
Webhook Retry Strategy:
├── First attempt: Immediately
├── Retry 1: After 5 minutes
├── Retry 2: After 30 minutes
├── Retry 3: After 2 hours
├── Retry 4: After 6 hours
└── Failed: Alert DevOps team

Store in Queue (Valkey):
  Key: b2b:webhook:CORR-B2B-ACME-001
  Value: { payload, retry_count, next_retry_time }
```

---

## 6. Phase 1.5 Milestones (Months 5-6)

| Milestone | Week | Deliverable |
|-----------|------|-------------|
| **Design** | Week 1 | ✅ This document |
| **Core Implementation** | Weeks 2-3 | NestJS module + Spring Boot integration |
| **Schema Validation** | Week 3 | JSON schema files + tests |
| **Pilot Partner Setup** | Week 4 | Configure 2-3 B2B partners |
| **End-to-End Testing** | Week 5 | Full PO→Invoice→Ledger flow |
| **Go-Live** | Week 6 | Pilot with real B2B transactions |

---

## 7. Compliance & Audit Trail

### **Every Message Logged**

```sql
CREATE TABLE b2b_edi_messages (
  id UUID PRIMARY KEY,
  message_type TEXT,                    -- "purchase_order", "invoice"
  correlation_id TEXT,
  sender_party_id TEXT,
  timestamp TIMESTAMP,
  raw_json_payload JSONB,               -- Full message
  validation_status TEXT,               -- "VALID", "INVALID"
  processing_status TEXT,               -- "PENDING", "PROCESSED", "FAILED"
  error_details JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Immutable: Trigger blocks updates
CREATE TRIGGER prevent_message_update
BEFORE UPDATE ON b2b_edi_messages
FOR EACH ROW EXECUTE FUNCTION raise_immutable_error();
```

---

## 8. Security Requirements

- ✅ **Authentication:** OAuth2 (Keycloak)
- ✅ **Authorization:** Each B2B partner has limited API scope
- ✅ **Encryption:** TLS 1.2+ for all API calls
- ✅ **Digital Signature:** SHA256 HMAC on critical messages
- ✅ **Rate Limiting:** 100 POs/min per partner (via APISIX)
- ✅ **IP Whitelisting:** Optional per B2B partner

---

## Next Steps

1. ✅ Share this design with tech team + B2B partners
2. ⏳ Create Spring Boot ledger posting module
3. ⏳ Build NestJS B2B sync service
4. ⏳ Develop JSON schema validation files
5. ⏳ Set up test environment with mock B2B partner
6. ⏳ Pilot with real partner (Month 6)

