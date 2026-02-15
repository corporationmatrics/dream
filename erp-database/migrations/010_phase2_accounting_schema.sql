-- ============================================================================
-- PHASE 2 ACCOUNTING SCHEMA (in schema "accounting")
-- ============================================================================
-- Runs after Phase 1 migrations (001–006). All Phase 2 tables live in
-- schema "accounting" so they do not conflict with public.users, public.products,
-- public.orders, public.invoices used by NestJS/erp-api.
-- Spring Boot erp-accounting uses spring.jpa.properties.hibernate.default_schema=accounting.
-- ============================================================================

CREATE SCHEMA IF NOT EXISTS accounting;
SET search_path TO accounting;

-- Enums (created in accounting schema)
CREATE TYPE business_type_enum AS ENUM ('RETAILER', 'WHOLESALER', 'MANUFACTURER', 'DISTRIBUTOR');
CREATE TYPE account_type_enum AS ENUM ('ASSET', 'LIABILITY', 'EQUITY', 'REVENUE', 'EXPENSE');
CREATE TYPE balance_type_enum AS ENUM ('DEBIT', 'CREDIT');
CREATE TYPE invoice_status_enum AS ENUM ('DRAFT', 'SENT', 'PARTIAL', 'PAID', 'OVERDUE');
CREATE TYPE journal_status_enum AS ENUM ('DRAFT', 'POSTED', 'REVERSED');
CREATE TYPE b2b_sync_status_enum AS ENUM ('PENDING', 'ACKNOWLEDGED', 'REJECTED', 'COMPLETED');
CREATE TYPE valuation_method_enum AS ENUM ('FIFO', 'WEIGHTED_AVG');
CREATE TYPE transaction_type_enum AS ENUM ('PURCHASE', 'SALE', 'ADJUSTMENT', 'DAMAGE', 'RETURN');
CREATE TYPE payment_mode_enum AS ENUM ('CASH', 'CHEQUE', 'BANK_TRANSFER', 'UPI', 'CARD');
CREATE TYPE po_status_enum AS ENUM ('DRAFT', 'CONFIRMED', 'RECEIVED', 'INVOICED', 'PAID');
CREATE TYPE payment_term_enum AS ENUM ('COD', 'NET_15', 'NET_30', 'NET_60');
CREATE TYPE gst_status_enum AS ENUM ('REGISTERED', 'UNREGISTERED', 'COMPOSITION');
CREATE TYPE role_enum AS ENUM ('OWNER', 'ACCOUNTANT', 'MANAGER', 'VIEWER');

-- ============================================================================
-- CORE RELATIONAL TABLES (all in accounting schema)
-- ============================================================================

CREATE TABLE tenants (
    tenant_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_name VARCHAR(255) NOT NULL,
    business_type business_type_enum NOT NULL,
    business_category VARCHAR(100),
    gstin VARCHAR(15) UNIQUE NOT NULL,
    pan VARCHAR(10),
    cin VARCHAR(21),
    address JSONB NOT NULL,
    phone VARCHAR(20),
    email VARCHAR(255),
    website VARCHAR(255),
    fiscal_year_start DATE,
    currency VARCHAR(3) DEFAULT 'INR',
    country_code VARCHAR(2) DEFAULT 'IN',
    timezone VARCHAR(100) DEFAULT 'Asia/Kolkata',
    inventory_valuation_method valuation_method_enum DEFAULT 'FIFO',
    reorder_threshold DECIMAL(10, 2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE
);

CREATE INDEX idx_tenants_gstin ON tenants(gstin);
CREATE INDEX idx_tenants_active ON tenants(is_active);
COMMENT ON TABLE tenants IS 'Business profiles for multi-tenancy - Retailers, Wholesalers, Manufacturers';

CREATE TABLE users (
    user_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(tenant_id) ON DELETE CASCADE,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100),
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    password_hash VARCHAR(255),
    keycloak_id VARCHAR(255),
    role role_enum NOT NULL,
    permissions JSONB DEFAULT '[]',
    is_active BOOLEAN DEFAULT TRUE,
    last_login TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(tenant_id, email)
);

CREATE INDEX idx_users_tenant ON users(tenant_id);
CREATE INDEX idx_users_keycloak ON users(keycloak_id);
COMMENT ON TABLE users IS 'User accounts with role-based access control';

CREATE TABLE chart_of_accounts (
    account_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(tenant_id) ON DELETE CASCADE,
    account_code VARCHAR(20) NOT NULL,
    account_name VARCHAR(255) NOT NULL,
    account_description TEXT,
    account_type account_type_enum NOT NULL,
    account_subtype VARCHAR(100),
    gst_applicable BOOLEAN DEFAULT FALSE,
    default_gst_rate DECIMAL(5, 2),
    parent_account_id UUID REFERENCES chart_of_accounts(account_id) ON DELETE SET NULL,
    hierarchy_level INT DEFAULT 0,
    normal_balance balance_type_enum NOT NULL,
    allow_manual_entries BOOLEAN DEFAULT TRUE,
    is_active BOOLEAN DEFAULT TRUE,
    archived_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(user_id),
    UNIQUE(tenant_id, account_code)
);

CREATE INDEX idx_chart_tenant ON chart_of_accounts(tenant_id);
CREATE INDEX idx_chart_parent ON chart_of_accounts(parent_account_id);
CREATE INDEX idx_chart_type ON chart_of_accounts(account_type);
COMMENT ON TABLE chart_of_accounts IS 'Hierarchical master list of accounts - ASSET, LIABILITY, EQUITY, REVENUE, EXPENSE';

CREATE TABLE journal_entries (
    journal_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(tenant_id) ON DELETE CASCADE,
    entry_number VARCHAR(50) NOT NULL,
    entry_date DATE NOT NULL DEFAULT CURRENT_DATE,
    reference_type VARCHAR(50),
    reference_id VARCHAR(100),
    description TEXT NOT NULL,
    status journal_status_enum NOT NULL DEFAULT 'DRAFT',
    total_debit DECIMAL(15, 2) NOT NULL DEFAULT 0,
    total_credit DECIMAL(15, 2) NOT NULL DEFAULT 0,
    is_balanced BOOLEAN DEFAULT FALSE,
    posted_at TIMESTAMP,
    posted_by UUID REFERENCES users(user_id),
    reversed_at TIMESTAMP,
    reversed_by UUID REFERENCES users(user_id),
    reversal_reason TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by UUID NOT NULL REFERENCES users(user_id),
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(tenant_id, entry_number)
);

CREATE INDEX idx_journal_tenant ON journal_entries(tenant_id);
CREATE INDEX idx_journal_status ON journal_entries(status);
CREATE INDEX idx_journal_date ON journal_entries(entry_date);
COMMENT ON TABLE journal_entries IS 'Header-level double-entry transactions. IMMUTABLE once posted - errors use reversals only';

CREATE TABLE postings (
    posting_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(tenant_id) ON DELETE CASCADE,
    journal_id UUID NOT NULL REFERENCES journal_entries(journal_id) ON DELETE CASCADE,
    account_id UUID NOT NULL REFERENCES chart_of_accounts(account_id),
    posting_type balance_type_enum NOT NULL,
    amount DECIMAL(15, 2) NOT NULL,
    line_number INT NOT NULL,
    line_description VARCHAR(500),
    gst_applicable BOOLEAN DEFAULT FALSE,
    gst_rate DECIMAL(5, 2),
    gst_amount DECIMAL(15, 2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CHECK (amount > 0)
);

CREATE INDEX idx_postings_journal ON postings(journal_id);
CREATE INDEX idx_postings_account ON postings(account_id);
CREATE INDEX idx_postings_type ON postings(posting_type);
COMMENT ON TABLE postings IS 'Individual debit/credit legs. Every transaction must have Σ(DEBIT) = Σ(CREDIT)';

CREATE TABLE general_ledger (
    gl_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(tenant_id) ON DELETE CASCADE,
    account_id UUID NOT NULL REFERENCES chart_of_accounts(account_id),
    transaction_date DATE NOT NULL,
    posting_date DATE NOT NULL DEFAULT CURRENT_DATE,
    entry_type balance_type_enum NOT NULL,
    amount DECIMAL(15, 2) NOT NULL,
    description VARCHAR(500),
    reference_id VARCHAR(100),
    reference_type VARCHAR(50),
    journal_id UUID REFERENCES journal_entries(journal_id),
    is_posted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    posted_at TIMESTAMP,
    CHECK (amount > 0)
);

CREATE INDEX idx_gl_tenant ON general_ledger(tenant_id);
CREATE INDEX idx_gl_account ON general_ledger(account_id);
CREATE INDEX idx_gl_date ON general_ledger(transaction_date);
CREATE INDEX idx_gl_reference ON general_ledger(reference_id);
COMMENT ON TABLE general_ledger IS 'Immutable daily posting records - Source of truth for financial reporting';

CREATE TABLE customers (
    customer_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(tenant_id),
    customer_name VARCHAR(255) NOT NULL,
    customer_type VARCHAR(50) NOT NULL,
    phone VARCHAR(20),
    email VARCHAR(255),
    gstin VARCHAR(15),
    billing_address JSONB,
    shipping_address JSONB,
    credit_limit DECIMAL(15, 2) DEFAULT 0,
    credit_used DECIMAL(15, 2) DEFAULT 0,
    payment_terms VARCHAR(50),
    gst_applicable BOOLEAN DEFAULT TRUE,
    gst_status gst_status_enum,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_customers_tenant ON customers(tenant_id);
CREATE INDEX idx_customers_gstin ON customers(gstin);
COMMENT ON TABLE customers IS 'B2B customers, retailers, distributors - Debtors for AR tracking';

CREATE TABLE suppliers (
    supplier_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(tenant_id),
    supplier_name VARCHAR(255) NOT NULL,
    supplier_type VARCHAR(50),
    phone VARCHAR(20),
    email VARCHAR(255),
    gstin VARCHAR(15) NOT NULL UNIQUE,
    pan VARCHAR(10),
    address JSONB,
    payment_terms VARCHAR(50),
    bank_details JSONB,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_suppliers_tenant ON suppliers(tenant_id);
CREATE INDEX idx_suppliers_gstin ON suppliers(gstin);
COMMENT ON TABLE suppliers IS 'Vendors/Creditors for AP tracking';

CREATE TABLE products (
    product_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(tenant_id),
    product_code VARCHAR(100) NOT NULL,
    product_name VARCHAR(255) NOT NULL,
    product_description TEXT,
    category VARCHAR(100),
    hsn_code VARCHAR(10) NOT NULL,
    cost_price DECIMAL(15, 2) NOT NULL,
    selling_price DECIMAL(15, 2) NOT NULL,
    gst_rate DECIMAL(5, 2) NOT NULL,
    unit_of_measure VARCHAR(20) DEFAULT 'PIECE',
    reorder_level INT DEFAULT 10,
    reorder_quantity INT DEFAULT 50,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(tenant_id, product_code)
);

CREATE INDEX idx_products_tenant ON products(tenant_id);
CREATE INDEX idx_products_hsn ON products(hsn_code);
COMMENT ON TABLE products IS 'Product master with HSN code for GST classification';

CREATE TABLE inventory_ledger (
    ledger_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(tenant_id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(product_id),
    transaction_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    transaction_type transaction_type_enum NOT NULL,
    quantity_in INT DEFAULT 0,
    quantity_out INT DEFAULT 0,
    unit_cost DECIMAL(15, 2),
    batch_number VARCHAR(100),
    expiry_date DATE,
    manufacture_date DATE,
    reference_id VARCHAR(100),
    reference_type VARCHAR(50),
    valuation_method valuation_method_enum,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(user_id)
);

CREATE INDEX idx_inventory_tenant ON inventory_ledger(tenant_id);
CREATE INDEX idx_inventory_product ON inventory_ledger(product_id);
CREATE INDEX idx_inventory_date ON inventory_ledger(transaction_date);
CREATE INDEX idx_inventory_reference ON inventory_ledger(reference_id);
COMMENT ON TABLE inventory_ledger IS 'Real-time stock movements with batch tracking for FIFO/Weighted Average COGS';

CREATE TABLE inventory_balance (
    balance_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(tenant_id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(product_id),
    quantity_on_hand INT NOT NULL DEFAULT 0,
    inventory_value DECIMAL(15, 2) NOT NULL DEFAULT 0,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(tenant_id, product_id)
);

CREATE INDEX idx_balance_tenant ON inventory_balance(tenant_id);
COMMENT ON TABLE inventory_balance IS 'Cached real-time inventory balance - updated via Redis and DB';

CREATE TABLE invoices (
    invoice_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(tenant_id) ON DELETE CASCADE,
    customer_id UUID NOT NULL REFERENCES customers(customer_id),
    invoice_number VARCHAR(50) NOT NULL,
    invoice_date DATE NOT NULL DEFAULT CURRENT_DATE,
    due_date DATE,
    subtotal DECIMAL(15, 2) NOT NULL,
    cgst_amount DECIMAL(15, 2) DEFAULT 0,
    sgst_amount DECIMAL(15, 2) DEFAULT 0,
    igst_amount DECIMAL(15, 2) DEFAULT 0,
    total_tax DECIMAL(15, 2) DEFAULT 0,
    total_amount DECIMAL(15, 2) NOT NULL,
    status invoice_status_enum NOT NULL DEFAULT 'DRAFT',
    amount_paid DECIMAL(15, 2) DEFAULT 0,
    outstanding DECIMAL(15, 2),
    payment_terms VARCHAR(50),
    notes TEXT,
    is_posted BOOLEAN DEFAULT FALSE,
    posted_at TIMESTAMP,
    journal_id UUID REFERENCES journal_entries(journal_id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(tenant_id, invoice_number)
);

CREATE INDEX idx_invoices_tenant ON invoices(tenant_id);
CREATE INDEX idx_invoices_customer ON invoices(customer_id);
CREATE INDEX idx_invoices_status ON invoices(status);
COMMENT ON TABLE invoices IS 'Sales invoices - triggers AR creation and GL posting';

CREATE TABLE invoice_lines (
    line_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_id UUID NOT NULL REFERENCES invoices(invoice_id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(product_id),
    line_number INT NOT NULL,
    quantity INT NOT NULL,
    unit_price DECIMAL(15, 2) NOT NULL,
    line_total DECIMAL(15, 2) NOT NULL,
    gst_rate DECIMAL(5, 2),
    gst_amount DECIMAL(15, 2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_invoice_lines_invoice ON invoice_lines(invoice_id);
COMMENT ON TABLE invoice_lines IS 'Line items on sales invoices';

CREATE TABLE purchase_orders (
    po_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(tenant_id) ON DELETE CASCADE,
    supplier_id UUID NOT NULL REFERENCES suppliers(supplier_id),
    po_number VARCHAR(50) NOT NULL,
    po_date DATE NOT NULL DEFAULT CURRENT_DATE,
    expected_delivery_date DATE,
    subtotal DECIMAL(15, 2) NOT NULL,
    cgst_amount DECIMAL(15, 2) DEFAULT 0,
    sgst_amount DECIMAL(15, 2) DEFAULT 0,
    igst_amount DECIMAL(15, 2) DEFAULT 0,
    total_tax DECIMAL(15, 2) DEFAULT 0,
    total_amount DECIMAL(15, 2) NOT NULL,
    status po_status_enum NOT NULL DEFAULT 'DRAFT',
    goods_received_qty INT DEFAULT 0,
    is_posted BOOLEAN DEFAULT FALSE,
    journal_id UUID REFERENCES journal_entries(journal_id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(tenant_id, po_number)
);

CREATE INDEX idx_po_tenant ON purchase_orders(tenant_id);
CREATE INDEX idx_po_supplier ON purchase_orders(supplier_id);
COMMENT ON TABLE purchase_orders IS 'Purchase orders - triggers AP creation and inventory GRN';

CREATE TABLE po_lines (
    line_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    po_id UUID NOT NULL REFERENCES purchase_orders(po_id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(product_id),
    line_number INT NOT NULL,
    quantity_ordered INT NOT NULL,
    quantity_received INT DEFAULT 0,
    unit_price DECIMAL(15, 2) NOT NULL,
    line_total DECIMAL(15, 2) NOT NULL,
    gst_rate DECIMAL(5, 2),
    gst_amount DECIMAL(15, 2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_po_lines_po ON po_lines(po_id);
COMMENT ON TABLE po_lines IS 'Line items on purchase orders';

CREATE TABLE payments_received (
    payment_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(tenant_id) ON DELETE CASCADE,
    customer_id UUID NOT NULL REFERENCES customers(customer_id),
    payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
    amount DECIMAL(15, 2) NOT NULL,
    payment_mode payment_mode_enum NOT NULL,
    reference_number VARCHAR(100),
    is_reconciled BOOLEAN DEFAULT FALSE,
    reconciled_against JSONB,
    journal_id UUID REFERENCES journal_entries(journal_id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_payment_rec_tenant ON payments_received(tenant_id);
CREATE INDEX idx_payment_rec_customer ON payments_received(customer_id);
COMMENT ON TABLE payments_received IS 'Cash receipts from customers - reduces AR';

CREATE TABLE payments_made (
    payment_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(tenant_id) ON DELETE CASCADE,
    supplier_id UUID NOT NULL REFERENCES suppliers(supplier_id),
    payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
    amount DECIMAL(15, 2) NOT NULL,
    payment_mode payment_mode_enum NOT NULL,
    reference_number VARCHAR(100),
    is_reconciled BOOLEAN DEFAULT FALSE,
    reconciled_against JSONB,
    journal_id UUID REFERENCES journal_entries(journal_id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_payment_made_tenant ON payments_made(tenant_id);
CREATE INDEX idx_payment_made_supplier ON payments_made(supplier_id);
COMMENT ON TABLE payments_made IS 'Cash payments to suppliers - reduces AP';

CREATE TABLE ledger_accounts (
    ledger_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(tenant_id) ON DELETE CASCADE,
    customer_id UUID REFERENCES customers(customer_id) ON DELETE CASCADE,
    supplier_id UUID REFERENCES suppliers(supplier_id) ON DELETE CASCADE,
    transaction_date DATE NOT NULL,
    transaction_type VARCHAR(50),
    reference_id VARCHAR(100),
    debit DECIMAL(15, 2) DEFAULT 0,
    credit DECIMAL(15, 2) DEFAULT 0,
    running_balance DECIMAL(15, 2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CHECK ((customer_id IS NULL OR supplier_id IS NULL) AND (customer_id IS NOT NULL OR supplier_id IS NOT NULL))
);

CREATE INDEX idx_ledger_customer ON ledger_accounts(customer_id);
CREATE INDEX idx_ledger_supplier ON ledger_accounts(supplier_id);
CREATE INDEX idx_ledger_date ON ledger_accounts(transaction_date);
COMMENT ON TABLE ledger_accounts IS 'Customer and supplier subsidiary ledgers for AR/AP tracking';

CREATE TABLE b2b_sync_map (
    sync_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    seller_tenant_id UUID NOT NULL REFERENCES tenants(tenant_id),
    seller_invoice_id VARCHAR(100) NOT NULL,
    seller_invoice_date DATE NOT NULL,
    buyer_tenant_id UUID NOT NULL REFERENCES tenants(tenant_id),
    buyer_po_id VARCHAR(100),
    buyer_po_date DATE,
    sync_status b2b_sync_status_enum NOT NULL DEFAULT 'PENDING',
    edi_payload JSONB NOT NULL,
    seller_amount DECIMAL(15, 2) NOT NULL,
    buyer_amount DECIMAL(15, 2),
    variance DECIMAL(15, 2),
    variance_reason TEXT,
    seller_journal_created BOOLEAN DEFAULT FALSE,
    buyer_journal_created BOOLEAN DEFAULT FALSE,
    seller_journal_id UUID REFERENCES journal_entries(journal_id),
    buyer_journal_id UUID REFERENCES journal_entries(journal_id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    acknowledged_at TIMESTAMP,
    completed_at TIMESTAMP
);

CREATE INDEX idx_b2b_seller ON b2b_sync_map(seller_tenant_id);
CREATE INDEX idx_b2b_buyer ON b2b_sync_map(buyer_tenant_id);
CREATE INDEX idx_b2b_status ON b2b_sync_map(sync_status);
COMMENT ON TABLE b2b_sync_map IS 'B2B EDI synchronization - links seller invoice to buyer PO for zero-manual-entry workflow';

CREATE TABLE gst_transactions (
    gst_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(tenant_id) ON DELETE CASCADE,
    transaction_date DATE NOT NULL,
    transaction_type VARCHAR(50) NOT NULL,
    reference_id VARCHAR(100),
    hsn_code VARCHAR(10),
    taxable_value DECIMAL(15, 2) NOT NULL,
    cgst_rate DECIMAL(5, 2),
    cgst_amount DECIMAL(15, 2),
    sgst_rate DECIMAL(5, 2),
    sgst_amount DECIMAL(15, 2),
    igst_rate DECIMAL(5, 2),
    igst_amount DECIMAL(15, 2),
    party_gstin VARCHAR(15),
    party_name VARCHAR(255),
    reported_in_gst_return BOOLEAN DEFAULT FALSE,
    gst_return_month VARCHAR(7),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CHECK (transaction_type IN ('INWARD', 'OUTWARD'))
);

CREATE INDEX idx_gst_tenant ON gst_transactions(tenant_id);
CREATE INDEX idx_gst_date ON gst_transactions(transaction_date);
COMMENT ON TABLE gst_transactions IS 'GST tracking for compliance - GSTR-1 (outward) and GSTR-3B (inward) reconciliation';

CREATE TABLE bank_accounts (
    bank_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(tenant_id) ON DELETE CASCADE,
    account_name VARCHAR(255) NOT NULL,
    bank_name VARCHAR(255) NOT NULL,
    branch_name VARCHAR(255),
    account_number VARCHAR(20) NOT NULL,
    ifsc_code VARCHAR(11) NOT NULL,
    account_type VARCHAR(50),
    cash_gl_account_id UUID NOT NULL REFERENCES chart_of_accounts(account_id),
    opening_balance DECIMAL(15, 2) DEFAULT 0,
    current_balance DECIMAL(15, 2) DEFAULT 0,
    last_reconciled_at TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(tenant_id, account_number)
);

CREATE INDEX idx_bank_tenant ON bank_accounts(tenant_id);
COMMENT ON TABLE bank_accounts IS 'Bank accounts linked to GL cash accounts';

CREATE TABLE bank_reconciliation (
    recon_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(tenant_id) ON DELETE CASCADE,
    bank_id UUID NOT NULL REFERENCES bank_accounts(bank_id),
    reconciliation_date DATE NOT NULL,
    bank_statement_balance DECIMAL(15, 2) NOT NULL,
    system_balance DECIMAL(15, 2) NOT NULL,
    difference DECIMAL(15, 2),
    status VARCHAR(20) NOT NULL,
    reconciled_by UUID REFERENCES users(user_id),
    matched_transactions JSONB DEFAULT '[]',
    unmatched_transactions JSONB DEFAULT '[]',
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP
);

CREATE INDEX idx_recon_bank ON bank_reconciliation(bank_id);
COMMENT ON TABLE bank_reconciliation IS 'Monthly bank statement reconciliation';

CREATE TABLE expenses (
    expense_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(tenant_id) ON DELETE CASCADE,
    expense_date DATE NOT NULL DEFAULT CURRENT_DATE,
    amount DECIMAL(15, 2) NOT NULL,
    category VARCHAR(100) NOT NULL,
    description TEXT,
    account_id UUID NOT NULL REFERENCES chart_of_accounts(account_id),
    gst_applicable BOOLEAN DEFAULT FALSE,
    gst_rate DECIMAL(5, 2),
    gst_amount DECIMAL(15, 2),
    payment_mode VARCHAR(50),
    bank_id UUID REFERENCES bank_accounts(bank_id),
    journal_id UUID REFERENCES journal_entries(journal_id),
    bill_attachment_url VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by UUID NOT NULL REFERENCES users(user_id)
);

CREATE INDEX idx_expenses_tenant ON expenses(tenant_id);
CREATE INDEX idx_expenses_category ON expenses(category);
CREATE INDEX idx_expenses_date ON expenses(expense_date);
COMMENT ON TABLE expenses IS 'Expense tracking with automatic GL posting';

-- ============================================================================
-- AUDIT TRIGGERS
-- ============================================================================

CREATE OR REPLACE FUNCTION audit_trigger_function() RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tenants_audit_trigger BEFORE UPDATE ON tenants FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();
CREATE TRIGGER users_audit_trigger BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();
CREATE TRIGGER chart_audit_trigger BEFORE UPDATE ON chart_of_accounts FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();
CREATE TRIGGER products_audit_trigger BEFORE UPDATE ON products FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();
CREATE TRIGGER customers_audit_trigger BEFORE UPDATE ON customers FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();
CREATE TRIGGER suppliers_audit_trigger BEFORE UPDATE ON suppliers FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();
CREATE TRIGGER invoices_audit_trigger BEFORE UPDATE ON invoices FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();
CREATE TRIGGER po_audit_trigger BEFORE UPDATE ON purchase_orders FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

-- ============================================================================
-- END OF PHASE 2 MIGRATION (schema: accounting)
-- ============================================================================
