-- Insert test users
INSERT INTO public.users (email, name, role)
VALUES
    ('admin@erp.local', 'Admin User', 'admin'),
    ('manager@erp.local', 'Manager User', 'manager'),
    ('user@erp.local', 'Regular User', 'user')
ON CONFLICT (email) DO NOTHING;

-- Insert test products
INSERT INTO public.products (name, description, sku, price, stock)
VALUES
    ('Product A', 'Description for Product A', 'SKU-001', 99.99, 100),
    ('Product B', 'Description for Product B', 'SKU-002', 149.99, 50),
    ('Product C', 'Description for Product C', 'SKU-003', 49.99, 200)
ON CONFLICT (sku) DO NOTHING;

-- Insert test GL accounts
INSERT INTO public.gl_accounts (account_code, account_name, account_type, description)
VALUES
    ('1000', 'Cash', 'Asset', 'Cash on hand and in bank'),
    ('1100', 'Accounts Receivable', 'Asset', 'Money owed by customers'),
    ('2000', 'Accounts Payable', 'Liability', 'Money owed to suppliers'),
    ('3000', 'Retained Earnings', 'Equity', 'Accumulated profits'),
    ('4000', 'Sales Revenue', 'Revenue', 'Revenue from sales'),
    ('5000', 'Cost of Goods Sold', 'Expense', 'Cost of goods sold')
ON CONFLICT (account_code) DO NOTHING;
