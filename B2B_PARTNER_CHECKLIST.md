# B2B Partner Integration Checklist
**Status:** Phase 1.5 Planning (Month 5-6)  
**Date:** February 7, 2026

---

## Partner Selection Criteria

### **Tier 1: Pilot Partners (Select 2-3 for Month 5-6)**

| Criteria | Weight | Details |
|----------|--------|---------|
| **Annual PO Volume** | 20% | Minimum 50+ POs/month (steady flow for testing) |
| **API Readiness** | 25% | Has API/webhook infrastructure OR willing to build |
| **Business Relationship** | 20% | Existing customer with strategic importance |
| **Technical Maturity** | 20% | Can handle JSON EDI + webhook callbacks |
| **Willingness to Pilot** | 15% | Committed to early adoption + feedback |

**Preferred Profile:**
- Mid-size B2B partner (₹50L - ₹5Cr annual spending)
- Manufacturing or distribution company
- Using ERP or accounting software (understand business processes)
- Single warehouse (don't complicate with multi-location logistics yet)

---

## Pre-Integration Checklist (Partner Qualification)

### **Phase 1: Discovery (Week 1)**

- [ ] **Schedule intro call**
  - [ ] Discuss JSON-EDI protocol
  - [ ] Share [B2B_EDI_DESIGN.md](B2B_EDI_DESIGN.md)
  - [ ] Answer technical questions
  - [ ] Get initial buy-in

- [ ] **Gather technical details**
  - [ ] Partner's current ERP system (SAP, NetSuite, Tally, etc.)
  - [ ] Existing API/webhook capabilities
  - [ ] IT team contact (primary + backup)
  - [ ] Integration preference (REST API, Webhooks, File Transfer)
  - [ ] PO volume and frequency

- [ ] **Obtain business information**
  - [ ] GSTIN (for tax compliance)
  - [ ] Official business name
  - [ ] Billing/delivery addresses
  - [ ] Authorized signatory (for API access)
  - [ ] Payment terms (NET_30, NET_60, COD, etc.)

---

### **Phase 2: Technical Onboarding (Weeks 2-3)**

- [ ] **API Credentials Setup**
  - [ ] Create OAuth2 client in Keycloak
  - [ ] Generate API key
  - [ ] Set rate limits (100 POs/min for testing)
  - [ ] Configure IP whitelist (if required)
  - [ ] Email credentials securely to partner

- [ ] **Webhook Configuration**
  - [ ] Partner provides webhook URL (staging first)
  - [ ] Add partner webhook endpoint to our system
  - [ ] Test webhook delivery with mock events
  - [ ] Verify SSL certificate validity
  - [ ] Configure retry strategy (5min, 30min, 2hr, 6hr)

- [ ] **Data Mapping Agreement**
  - [ ] Confirm all required fields in PO message
  - [ ] Map partner's product IDs to our SKUs
  - [ ] Confirm tax rates and GST compliance
  - [ ] Agree on currency and payment terms
  - [ ] Document any custom requirements

- [ ] **Documentation Shared**
  - [ ] [ ] Share [B2B_API_CONTRACT.yaml](B2B_API_CONTRACT.yaml)
  - [ ] Share JSON Schema files (po.schema.json, invoice.schema.json)
  - [ ] Share error codes reference
  - [ ] Share webhook event types
  - [ ] Provide sandbox API endpoint for testing

---

### **Phase 3: Testing (Weeks 3-4)**

- [ ] **Partner Submits Test POs**
  - [ ] at least 5 test purchase orders
  - [ ] Varying quantities, products, payment terms
  - [ ] Test error scenarios (invalid product ID, qty exceeds stock)
  - [ ] Document any validation errors

- [ ] **Validate PO Intake**
  - [ ] [ ] PO JSON received and validated
  - [ ] [ ] Internal order created successfully
  - [ ] [ ] Inventory checked and reserved
  - [ ] [ ] POA (acknowledgment) sent via webhook
  - [ ] [ ] Partner received acknowledgment successfully

- [ ] **Test Invoice Flow**
  - [ ] [ ] Create order fulfillment (simulate shipment)
  - [ ] [ ] Generate Invoice JSON-EDI
  - [ ] [ ] Invoice sent via webhook
  - [ ] [ ] Partner received and processed invoice
  - [ ] [ ] Verify amounts match (no discrepancies)

- [ ] **Test Ledger Integration**
  - [ ] [ ] AP liability entry created (Accounts Payable)
  - [ ] [ ] Inventory debit entry created
  - [ ] [ ] GST input entry created
  - [ ] [ ] Ledger entries balanced (debit = credit)
  - [ ] [ ] No duplicate postings

- [ ] **Error Handling Tests**
  - [ ] [ ] Partner sends invalid PO (missing field) → Validate error response
  - [ ] [ ] Partner sends duplicate PO → System rejects with "duplicate" error
  - [ ] [ ] Webhook delivery fails → System retries 4 times
  - [ ] [ ] Network timeout during PO intake → Graceful handling

---

### **Phase 4: Production Migration (Week 5-6)**

- [ ] **Update Credentials**
  - [ ] Create new OAuth2 client for production
  - [ ] Generate production API key
  - [ ] Share production API endpoint
  - [ ] Increase rate limits if needed (based on real volume)

- [ ] **Switch to Production Webhook**
  - [ ] Partner updates webhook URL (from staging → production)
  - [ ] Test 1 live transaction end-to-end
  - [ ] Verify all systems updated (no stale references)

- [ ] **Go-Live Coordination**
  - [ ] Agree on go-live date
  - [ ] Partner stops manual PO submission (switch to API)
  - [ ] Monitor first 100 transactions closely
  - [ ] Have support person available for first 48 hours

- [ ] **Documentation Handoff**
  - [ ] Share integration runbook
  - [ ] Share troubleshooting guide
  - [ ] Provide support contact info
  - [ ] Confirm partner has backup contact

---

## Integration Configuration Template

### **For Each Partner, Complete:**

```yaml
partner:
  name: "Acme Corp"
  party_id: "B2B_PARTNER_001"
  gstin: "09AAACR1234H1Z1"
  
api_credentials:
  oauth2_client_id: "acme-corp-client-prod"
  oauth2_client_secret: "***SECURE***"
  rate_limit: "100 POs/min"
  ip_whitelist:
    - "203.0.113.0/24"
    - "198.51.100.5"

webhook_config:
  staging_url: "https://staging-webhook.acme.com/erp"
  production_url: "https://webhook.acme.com/erp"
  events:
    - "po.received"
    - "po.acknowledged"
    - "order.shipped"
    - "invoice.issued"
    - "payment.received"

business_config:
  currency: "INR"
  payment_terms: "NET_30"
  early_payment_discount: 2.5
  tax_rate: 0.18
  billing_address: |
    Acme Corp, Finance Dept
    123 Business Ave
    Bangalore, KA 560001
  delivery_address: |
    Acme Corp Warehouse
    456 Warehouse St
    Bangalore, KA 560002

product_mapping:
  - partner_sku: "ACME-WID-100"
    dream_sku: "SKU-12345"
    product_name: "Industrial Widget"
  - partner_sku: "ACME-COMP-50"
    dream_sku: "SKU-67890"
    product_name: "Premium Component"

contacts:
  primary:
    name: "John Doe"
    role: "Procurement Manager"
    email: "john@acme.com"
    phone: "+91-80-XXXX-XXXX"
  backup:
    name: "Jane Smith"
    role: "Logistics Manager"
    email: "jane@acme.com"
    phone: "+91-80-YYYY-YYYY"
  technical:
    name: "Bob Wilson"
    role: "Systems Admin"
    email: "bob@acme.com"
    phone: "+91-80-ZZZZ-ZZZZ"

go_live:
  date: "2026-02-28"
  first_po_expected: "2026-02-28T10:00:00Z"
  support_escalation: "DevOps Team"
  post_go_live_review: "2026-03-07"
```

---

## Partner Communication Templates

### **Email 1: Initial Outreach (Week 1)**

```
Subject: B2B Integration opportunity - Zero-Manual PO-to-Invoice Automation

Hi [Partner Name],

We're excited to launch a new B2B integration feature that will eliminate 
manual PO entry and automate your entire order-to-cash cycle.

Key Benefits:
  • PO → Order → Invoice → Ledger in < 5 minutes (vs. 2-3 days manual)
  • Real-time order status tracking
  • Automatic invoice generation + posting to your GL
  • Reduced data entry errors

We'd like to pilot this with 2-3 strategic partners starting Month 5.
You'd be among the first to experience this automation.

Attached: B2B_EDI_DESIGN.md (technical overview)

Would you be interested in a 30-min call this week to discuss?

Best regards,
[Integration Team]
```

### **Email 2: Post-Testing (Week 4)**

```
Subject: B2B Integration - Testing Complete ✅

Hi [Partner Name],

Great news! We've completed testing with your team and everything looks solid:

Test Results:
  ✅ 5 POs processed without errors
  ✅ POA (acknowledgment) sent successfully
  ✅ Invoice generation & posting working
  ✅ Ledger entries balanced correctly

Next Steps:
  1. Partner confirms ready for Production (Week 5)
  2. We provision production API credentials
  3. Partner updates webhook URL to Production
  4. Go-live on [DATE]

Questions? Reply to this email or contact [Technical Contact].

Looking forward to launch! 🚀
```

### **Email 3: Go-Live Notification (Day Before)**

```
Subject: B2B Integration Go-Live Tomorrow [02/28/2026]

Hi [Partner Name],

Just confirming: Tomorrow at 10:00 AM, your system will begin sending 
Purchase Orders to Dream ERP via our new JSON-EDI API.

⚠️ Important:
  • Stop manual PO submission once first API PO succeeds
  • Monitor first 10 transactions closely
  • Contact [Support] immediately if any issues

We'll have dedicated support available for the first 48 hours.

Let's make this smooth! 💪
```

---

## SLA & Support Matrix

| Item | Production SLA | Support Channel |
|------|----------------|-----------------|
| **API Connectivity** | 99.5% uptime | Email / Phone |
| **PO Processing** | < 5 min from submission | Ticketing system |
| **Webhook Delivery** | 4 retries over 10+ hours | Auto-retry + manual |
| **Invoice Issuance** | < 2 hrs after order completion | Phone for critical issues |
| **Support Response** | Critical: < 2 hrs, Normal: < 8 hrs | Email + Slack |

---

## Monthly Partner Review (Post-Go-Live)

### **Metrics to Track**

```
Partner Performance Dashboard:

January 2026 (Month 1):
├─ POs Submitted (API): 143
├─ POs Success Rate: 99.3%
├─ Avg Processing Time: 3.2 min
├─ Invoices Generated: 143
├─ Webhook Delivery Success: 98.8%
└─ Issues Reported: 1 (resolved in < 4 hrs)

Monthly Review Call:
  ├─ What's working well?
  ├─ Any issues or friction?
  ├─ Feature requests for Phase 2?
  ├─ Ready to expand (more partners, more SKUs)?
  └─ Next month targets
```

---

## Success Criteria (Phase 1.5)

| Milestone | Success Metric | Target |
|-----------|----------------|--------|
| **Partner Onboarding** | Fully configured partners | 3 partners |
| **API Stability** | Transaction success rate | ≥ 99% |
| **Processing Speed** | Avg PO-to-Invoice time | ≤ 5 minutes |
| **Webhook Reliability** | Delivery success rate | ≥ 99% |
| **Zero Errors** | Manual intervention needed | ≤ 1% of transactions |
| **Team Confidence** | Readiness for Phase 2 scale | All systems stable |

---

## Escalation Path

```
Issue Detected
    ↓
Is it urgent? (Affects B2B Partner's business)
    ├─ YES → Call [Support Manager] immediately
    │         Engage [Dev Team Lead] if technical
    └─ NO → Email support ticket → scheduled review

Critical Issues (>1 partner impacted):
    → Page [CTO]
    → Gather [Engineering Team]
    → Implement hotfix within 1 hour
    → Post-incident review within 24 hrs
```

---

## Sign-Off

**Checklist Owner:** B2B Integration Lead  
**Partner Manager:** [Name]  
**Technical Lead:** [Name]  
**Last Updated:** February 7, 2026

---
