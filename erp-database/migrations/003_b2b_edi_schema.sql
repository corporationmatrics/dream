-- Migration: Create B2B EDI Tables
-- Version: 003_b2b_edi_schema.sql
-- Date: 2026-02-07

-- ==================== B2B Partners ====================
CREATE TABLE IF NOT EXISTS b2b_partners (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    party_id TEXT NOT NULL UNIQUE,
    party_name TEXT NOT NULL,
    gstin TEXT,
    email TEXT NOT NULL,
    webhook_url TEXT,
    webhook_active BOOLEAN DEFAULT true,
    rate_limit_per_minute INTEGER DEFAULT 100,
    ip_whitelist TEXT[] DEFAULT '{}',
    currency TEXT DEFAULT 'INR',
    payment_terms TEXT DEFAULT 'NET_30',
    early_payment_discount DECIMAL(5,2),
    billing_address JSONB,
    delivery_address JSONB,
    primary_contact JSONB,
    backup_contact JSONB,
    technical_contact JSONB,
    integration_status TEXT DEFAULT 'PENDING' CHECK (integration_status IN ('PENDING', 'TESTING', 'PRODUCTION', 'INACTIVE')),
    last_po_received_at TIMESTAMP,
    total_pos_count INTEGER DEFAULT 0,
    total_invoices_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    created_by UUID,
    updated_by UUID
);

CREATE INDEX idx_b2b_partners_party_id ON b2b_partners(party_id);
CREATE INDEX idx_b2b_partners_integration_status ON b2b_partners(integration_status);
CREATE INDEX idx_b2b_partners_gstin ON b2b_partners(gstin);

-- ==================== B2B Purchase Orders (EDI) ====================
CREATE TABLE IF NOT EXISTS b2b_purchase_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    po_number TEXT NOT NULL,
    message_id TEXT NOT NULL UNIQUE,
    correlation_id TEXT,
    b2b_partner_id UUID NOT NULL REFERENCES b2b_partners(id),
    po_date DATE NOT NULL,
    delivery_date DATE,
    currency TEXT DEFAULT 'INR',
    po_status TEXT DEFAULT 'NEW' CHECK (po_status IN ('NEW', 'ACKNOWLEDGED', 'REJECTED', 'PARTIAL', 'CANCELLED')),
    
    billing_address JSONB,
    delivery_address JSONB,
    payment_terms JSONB,
    
    subtotal DECIMAL(15,2),
    tax_total DECIMAL(15,2),
    shipping_charges DECIMAL(15,2) DEFAULT 0,
    grand_total DECIMAL(15,2),
    
    internal_order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
    raw_json_payload JSONB NOT NULL,
    
    validation_status TEXT DEFAULT 'VALID' CHECK (validation_status IN ('VALID', 'INVALID')),
    validation_errors JSONB,
    
    acknowledgment_sent_at TIMESTAMP,
    rejected_reason TEXT,
    
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    received_from_ip INET,
    received_by_user UUID
);

CREATE INDEX idx_b2b_po_po_number ON b2b_purchase_orders(po_number);
CREATE INDEX idx_b2b_po_message_id ON b2b_purchase_orders(message_id);
CREATE INDEX idx_b2b_po_correlation_id ON b2b_purchase_orders(correlation_id);
CREATE INDEX idx_b2b_po_partner ON b2b_purchase_orders(b2b_partner_id);
CREATE INDEX idx_b2b_po_status ON b2b_purchase_orders(po_status);
CREATE INDEX idx_b2b_po_date ON b2b_purchase_orders(po_date);
CREATE INDEX idx_b2b_po_internal_order ON b2b_purchase_orders(internal_order_id);

-- ==================== B2B PO Line Items ====================
CREATE TABLE IF NOT EXISTS b2b_po_lines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    b2b_po_id UUID NOT NULL REFERENCES b2b_purchase_orders(id) ON DELETE CASCADE,
    line_number INTEGER NOT NULL,
    
    product_id TEXT NOT NULL,
    product_name TEXT,
    qty DECIMAL(15,4) NOT NULL,
    unit TEXT,
    unit_price DECIMAL(15,4) NOT NULL,
    line_total DECIMAL(15,2),
    
    tax_rate DECIMAL(5,2),
    tax_amount DECIMAL(15,2),
    
    delivery_date DATE,
    special_instructions TEXT,
    
    -- Mapping to dream ERP products
    dream_product_id UUID REFERENCES products(id),
    qty_confirmed DECIMAL(15,4),
    qty_backorder DECIMAL(15,4) DEFAULT 0,
    
    created_at TIMESTAMP DEFAULT NOW(),
    CONSTRAINT valid_quantities CHECK (qty > 0)
);

CREATE INDEX idx_b2b_po_lines_po_id ON b2b_po_lines(b2b_po_id);
CREATE INDEX idx_b2b_po_lines_product_id ON b2b_po_lines(product_id);
CREATE INDEX idx_b2b_po_lines_dream_product_id ON b2b_po_lines(dream_product_id);

-- ==================== B2B Invoices (EDI) ====================
CREATE TABLE IF NOT EXISTS b2b_invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_number TEXT NOT NULL UNIQUE,
    message_id TEXT NOT NULL UNIQUE,
    correlation_id TEXT,
    
    b2b_partner_id UUID NOT NULL REFERENCES b2b_partners(id),
    b2b_po_id UUID REFERENCES b2b_purchase_orders(id),
    internal_order_id UUID REFERENCES orders(id),
    internal_invoice_id UUID REFERENCES invoices(id),
    
    invoice_date DATE NOT NULL,
    po_reference TEXT,
    invoice_status TEXT DEFAULT 'ISSUED' CHECK (invoice_status IN ('ISSUED', 'SENT', 'PAID', 'OVERDUE', 'CANCELLED')),
    
    currency TEXT DEFAULT 'INR',
    subtotal DECIMAL(15,2),
    tax_total DECIMAL(15,2),
    charges_total DECIMAL(15,2) DEFAULT 0,
    invoice_total DECIMAL(15,2),
    
    amount_paid DECIMAL(15,2) DEFAULT 0,
    amount_due DECIMAL(15,2),
    payment_due_date DATE,
    
    shipping_details JSONB,
    tax_details JSONB,
    payment_terms JSONB,
    early_payment_discount DECIMAL(5,2),
    discount_amount DECIMAL(15,2),
    
    raw_json_payload JSONB NOT NULL,
    
    webhook_sent_at TIMESTAMP,
    webhook_delivery_attempts INTEGER DEFAULT 0,
    webhook_last_attempt_at TIMESTAMP,
    webhook_delivery_status TEXT DEFAULT 'PENDING' CHECK (webhook_delivery_status IN ('PENDING', 'SENT', 'FAILED')),
    
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    posted_to_ledger_at TIMESTAMP,
    posted_to_ledger_by UUID
);

CREATE INDEX idx_b2b_inv_invoice_number ON b2b_invoices(invoice_number);
CREATE INDEX idx_b2b_inv_message_id ON b2b_invoices(message_id);
CREATE INDEX idx_b2b_inv_partner ON b2b_invoices(b2b_partner_id);
CREATE INDEX idx_b2b_inv_po ON b2b_invoices(b2b_po_id);
CREATE INDEX idx_b2b_inv_status ON b2b_invoices(invoice_status);
CREATE INDEX idx_b2b_inv_due_date ON b2b_invoices(payment_due_date);

-- ==================== B2B Invoice Line Items ====================
CREATE TABLE IF NOT EXISTS b2b_invoice_lines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    b2b_invoice_id UUID NOT NULL REFERENCES b2b_invoices(id) ON DELETE CASCADE,
    line_number INTEGER NOT NULL,
    
    po_line_reference TEXT,
    product_id TEXT NOT NULL,
    product_name TEXT,
    qty_shipped DECIMAL(15,4) NOT NULL,
    unit TEXT,
    unit_price DECIMAL(15,4) NOT NULL,
    line_total DECIMAL(15,2),
    
    tax_rate DECIMAL(5,2),
    tax_amount DECIMAL(15,2),
    
    dream_product_id UUID REFERENCES products(id),
    dream_invoice_line_id UUID REFERENCES invoice_items(id),
    
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_b2b_inv_lines_invoice_id ON b2b_invoice_lines(b2b_invoice_id);
CREATE INDEX idx_b2b_inv_lines_product_id ON b2b_invoice_lines(product_id);

-- ==================== EDI Message Audit Log ====================
CREATE TABLE IF NOT EXISTS b2b_edi_audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    message_type TEXT NOT NULL CHECK (message_type IN ('purchase_order', 'acknowledgment', 'invoice', 'rejection', 'webhook')),
    message_id TEXT,
    correlation_id TEXT,
    
    b2b_partner_id UUID REFERENCES b2b_partners(id),
    event TEXT NOT NULL,
    
    source_system TEXT, -- 'DREAM_ERP' or partner name
    event_status TEXT, -- 'SUCCESS', 'FAILURE', 'PENDING'
    event_message TEXT,
    
    raw_payload JSONB,
    response_payload JSONB,
    
    triggered_by_user UUID,
    triggered_from_ip INET,
    
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_b2b_audit_message_id ON b2b_edi_audit_log(message_id);
CREATE INDEX idx_b2b_audit_partner_id ON b2b_edi_audit_log(b2b_partner_id);
CREATE INDEX idx_b2b_audit_event ON b2b_edi_audit_log(event);
CREATE INDEX idx_b2b_audit_created_at ON b2b_edi_audit_log(created_at);

-- ==================== Webhook Events Queue ====================
CREATE TABLE IF NOT EXISTS b2b_webhook_queue (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    b2b_partner_id UUID NOT NULL REFERENCES b2b_partners(id),
    event_type TEXT NOT NULL,
    payload JSONB NOT NULL,
    
    retry_count INTEGER DEFAULT 0,
    max_retries INTEGER DEFAULT 4,
    next_retry_at TIMESTAMP,
    
    status TEXT DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'SENT', 'FAILED', 'DEAD_LETTER')),
    
    http_status_code INTEGER,
    error_message TEXT,
    
    created_at TIMESTAMP DEFAULT NOW(),
    sent_at TIMESTAMP,
    
    CONSTRAINT valid_retries CHECK (retry_count <= max_retries)
);

CREATE INDEX idx_webhook_queue_partner ON b2b_webhook_queue(b2b_partner_id);
CREATE INDEX idx_webhook_queue_status ON b2b_webhook_queue(status);
CREATE INDEX idx_webhook_queue_next_retry ON b2b_webhook_queue(next_retry_at) WHERE status = 'PENDING';

-- ==================== Triggers ====================

-- Prevent EDI message updates (immutable audit trail)
CREATE OR REPLACE FUNCTION prevent_b2b_edi_update()
RETURNS TRIGGER AS $$
BEGIN
    RAISE EXCEPTION 'EDI messages are immutable. Cannot update %.%', TG_TABLE_NAME, NEW.id;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER prevent_b2b_po_update
BEFORE UPDATE ON b2b_purchase_orders
FOR EACH ROW EXECUTE FUNCTION prevent_b2b_edi_update();

CREATE TRIGGER prevent_b2b_invoice_update
BEFORE UPDATE ON b2b_invoices
FOR EACH ROW EXECUTE FUNCTION prevent_b2b_edi_update();

-- Update b2b_partners stats on PO/Invoice
CREATE OR REPLACE FUNCTION update_b2b_partner_stats()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE b2b_partners
    SET 
        total_pos_count = (SELECT COUNT(*) FROM b2b_purchase_orders WHERE b2b_partner_id = NEW.b2b_partner_id),
        total_invoices_count = (SELECT COUNT(*) FROM b2b_invoices WHERE b2b_partner_id = NEW.b2b_partner_id),
        last_po_received_at = NOW(),
        updated_at = NOW()
    WHERE id = NEW.b2b_partner_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_stats_on_po_insert
AFTER INSERT ON b2b_purchase_orders
FOR EACH ROW EXECUTE FUNCTION update_b2b_partner_stats();

CREATE TRIGGER update_stats_on_invoice_insert
AFTER INSERT ON b2b_invoices
FOR EACH ROW EXECUTE FUNCTION update_b2b_partner_stats();

-- Auto-log EDI events to audit table
CREATE OR REPLACE FUNCTION audit_b2b_edi_events()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO b2b_edi_audit_log (
        message_type, message_id, correlation_id, b2b_partner_id,
        event, event_status, raw_payload
    ) VALUES (
        TG_ARGV[0], NEW.message_id, NEW.correlation_id, NEW.b2b_partner_id,
        TG_OP, COALESCE(NEW.validation_status, 'PENDING'), NEW.raw_json_payload
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER audit_po_insert
AFTER INSERT ON b2b_purchase_orders
FOR EACH ROW EXECUTE FUNCTION audit_b2b_edi_events('purchase_order');

CREATE TRIGGER audit_invoice_insert
AFTER INSERT ON b2b_invoices
FOR EACH ROW EXECUTE FUNCTION audit_b2b_edi_events('invoice');

-- Grant permissions
GRANT SELECT, INSERT ON b2b_partners TO app_user;
GRANT SELECT, INSERT ON b2b_purchase_orders TO app_user;
GRANT SELECT, INSERT ON b2b_po_lines TO app_user;
GRANT SELECT, INSERT ON b2b_invoices TO app_user;
GRANT SELECT, INSERT ON b2b_invoice_lines TO app_user;
GRANT SELECT, INSERT ON b2b_edi_audit_log TO app_user;
GRANT SELECT, INSERT, UPDATE ON b2b_webhook_queue TO app_user;
