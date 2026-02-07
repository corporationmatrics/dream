-- GL Accounts (Chart of Accounts)
CREATE TABLE public.gl_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_code VARCHAR(20) UNIQUE NOT NULL,
    account_name VARCHAR(255) NOT NULL,
    account_type VARCHAR(50) NOT NULL, -- Asset, Liability, Equity, Revenue, Expense
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- GL Entries (Ledger)
CREATE TABLE public.gl_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_id UUID NOT NULL REFERENCES public.gl_accounts(id),
    debit NUMERIC(12, 2),
    credit NUMERIC(12, 2),
    description TEXT,
    reference_type VARCHAR(50),
    reference_id UUID,
    entry_date DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Invoices
CREATE TABLE public.invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_number VARCHAR(50) UNIQUE NOT NULL,
    order_id UUID NOT NULL REFERENCES public.orders(id),
    amount NUMERIC(12, 2) NOT NULL,
    tax NUMERIC(12, 2),
    total NUMERIC(12, 2) NOT NULL,
    status VARCHAR(50) DEFAULT 'draft',
    issued_date DATE,
    due_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_gl_accounts_code ON public.gl_accounts(account_code);
CREATE INDEX idx_gl_entries_account_id ON public.gl_entries(account_id);
CREATE INDEX idx_gl_entries_date ON public.gl_entries(entry_date);
CREATE INDEX idx_invoices_number ON public.invoices(invoice_number);
CREATE INDEX idx_invoices_status ON public.invoices(status);
