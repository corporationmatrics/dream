-- Sample Data for ERP Platform
-- Insert test users
INSERT INTO public.users (id, email, name, password, role, is_active) VALUES
  ('550e8400-e29b-41d4-a716-446655440001'::uuid, 'john@example.com', 'John Doe', '$2b$10$demo.hash.password', 'user', true),
  ('550e8400-e29b-41d4-a716-446655440002'::uuid, 'jane@example.com', 'Jane Smith', '$2b$10$demo.hash.password', 'user', true),
  ('550e8400-e29b-41d4-a716-446655440003'::uuid, 'admin@example.com', 'Admin User', '$2b$10$demo.hash.password', 'admin', true);

-- Insert sample products
INSERT INTO public.products (id, name, description, sku, price, stock, category, status) VALUES
  ('650e8400-e29b-41d4-a716-446655440001'::uuid, 'Laptop Pro', 'High-performance laptop for professionals', 'LAPTOP-001', 1299.99, 15, 'Electronics', 'active'),
  ('650e8400-e29b-41d4-a716-446655440002'::uuid, 'Wireless Mouse', 'Ergonomic wireless mouse with USB receiver', 'MOUSE-W01', 29.99, 50, 'Accessories', 'active'),
  ('650e8400-e29b-41d4-a716-446655440003'::uuid, 'USB-C Hub', 'Multi-port USB-C hub with charging', 'HUB-UC01', 49.99, 30, 'Accessories', 'active'),
  ('650e8400-e29b-41d4-a716-446655440004'::uuid, 'Mechanical Keyboard', 'RGB Mechanical Gaming Keyboard', 'KB-MECH01', 129.99, 25, 'Accessories', 'active'),
  ('650e8400-e29b-41d4-a716-446655440005'::uuid, 'Monitor 4K', '27-inch 4K UHD Monitor', 'MON-4K27', 399.99, 10, 'Electronics', 'active'),
  ('650e8400-e29b-41d4-a716-446655440006'::uuid, 'USB-C Cable', 'Premium braided USB-C cable 2M', 'CABLE-UC2', 15.99, 100, 'Cables', 'active'),
  ('650e8400-e29b-41d4-a716-446655440007'::uuid, 'Webcam HD', '1080p HD Webcam with microphone', 'WEBCAM-HD', 59.99, 20, 'Accessories', 'active'),
  ('650e8400-e29b-41d4-a716-446655440008'::uuid, 'Monitor Stand', 'Adjustable dual monitor stand', 'STAND-DUO', 89.99, 12, 'Accessories', 'active');

-- Insert sample orders
INSERT INTO public.orders (id, order_number, user_id, subtotal, discount, tax_amount, total_amount, status, notes) VALUES
  ('750e8400-e29b-41d4-a716-446655440001'::uuid, 'ORD-2026020501', '550e8400-e29b-41d4-a716-446655440001'::uuid, 1329.98, 0, 132.99, 1462.97, 'pending', 'High priority order'),
  ('750e8400-e29b-41d4-a716-446655440002'::uuid, 'ORD-2026020502', '550e8400-e29b-41d4-a716-446655440002'::uuid, 199.96, 20, 17.99, 197.95, 'shipped', 'Standard delivery'),
  ('750e8400-e29b-41d4-a716-446655440003'::uuid, 'ORD-2026020503', '550e8400-e29b-41d4-a716-446655440001'::uuid, 449.99, 0, 45, 494.99, 'delivered', 'Delivered on time');

-- Insert sample order items
INSERT INTO public.order_items (id, order_id, product_id, quantity, unit_price) VALUES
  ('850e8400-e29b-41d4-a716-446655440001'::uuid, '750e8400-e29b-41d4-a716-446655440001'::uuid, '650e8400-e29b-41d4-a716-446655440001'::uuid, 1, 1299.99),
  ('850e8400-e29b-41d4-a716-446655440002'::uuid, '750e8400-e29b-41d4-a716-446655440001'::uuid, '650e8400-e29b-41d4-a716-446655440002'::uuid, 1, 29.99),
  ('850e8400-e29b-41d4-a716-446655440003'::uuid, '750e8400-e29b-41d4-a716-446655440002'::uuid, '650e8400-e29b-41d4-a716-446655440003'::uuid, 3, 49.99),
  ('850e8400-e29b-41d4-a716-446655440004'::uuid, '750e8400-e29b-41d4-a716-446655440002'::uuid, '650e8400-e29b-41d4-a716-446655440006'::uuid, 2, 15.99),
  ('850e8400-e29b-41d4-a716-446655440005'::uuid, '750e8400-e29b-41d4-a716-446655440003'::uuid, '650e8400-e29b-41d4-a716-446655440005'::uuid, 1, 399.99),
  ('850e8400-e29b-41d4-a716-446655440006'::uuid, '750e8400-e29b-41d4-a716-446655440003'::uuid, '650e8400-e29b-41d4-a716-446655440007'::uuid, 1, 59.99);

-- Insert sample GL accounts (Chart of Accounts)
INSERT INTO public.gl_accounts (id, account_code, account_name, account_type, description, is_active) VALUES
  ('950e8400-e29b-41d4-a716-446655440001'::uuid, '1000', 'Cash', 'Asset', 'Operating cash account', true),
  ('950e8400-e29b-41d4-a716-446655440002'::uuid, '1100', 'Accounts Receivable', 'Asset', 'Customer receivables', true),
  ('950e8400-e29b-41d4-a716-446655440003'::uuid, '1200', 'Inventory', 'Asset', 'Product inventory', true),
  ('950e8400-e29b-41d4-a716-446655440004'::uuid, '2000', 'Accounts Payable', 'Liability', 'Vendor payables', true),
  ('950e8400-e29b-41d4-a716-446655440005'::uuid, '3000', 'Retained Earnings', 'Equity', 'Retained earnings', true),
  ('950e8400-e29b-41d4-a716-446655440006'::uuid, '4000', 'Sales Revenue', 'Revenue', 'Product sales revenue', true),
  ('950e8400-e29b-41d4-a716-446655440007'::uuid, '5000', 'Cost of Goods Sold', 'Expense', 'COGS', true),
  ('950e8400-e29b-41d4-a716-446655440008'::uuid, '5100', 'Operating Expenses', 'Expense', 'General operating expenses', true),
  ('950e8400-e29b-41d4-a716-446655440009'::uuid, '7000', 'Interest Expense', 'Expense', 'Interest on loans', true);

-- Insert sample GL entries from order transactions
INSERT INTO public.gl_entries (id, account_id, debit, credit, description, reference_type, reference_id, entry_date) VALUES
  ('a50e8400-e29b-41d4-a716-446655440001'::uuid, '950e8400-e29b-41d4-a716-446655440001'::uuid, 1462.97, NULL, 'Order ORD-2026020501 payment received', 'order', '750e8400-e29b-41d4-a716-446655440001', CURRENT_DATE),
  ('a50e8400-e29b-41d4-a716-446655440002'::uuid, '950e8400-e29b-41d4-a716-446655440006'::uuid, NULL, 1462.97, 'Sales revenue from order ORD-2026020501', 'order', '750e8400-e29b-41d4-a716-446655440001', CURRENT_DATE),
  ('a50e8400-e29b-41d4-a716-446655440003'::uuid, '950e8400-e29b-41d4-a716-446655440001'::uuid, 197.95, NULL, 'Order ORD-2026020502 payment received', 'order', '750e8400-e29b-41d4-a716-446655440002', CURRENT_DATE),
  ('a50e8400-e29b-41d4-a716-446655440004'::uuid, '950e8400-e29b-41d4-a716-446655440006'::uuid, NULL, 197.95, 'Sales revenue from order ORD-2026020502', 'order', '750e8400-e29b-41d4-a716-446655440002', CURRENT_DATE);

-- Insert sample invoices
INSERT INTO public.invoices (id, invoice_number, order_id, amount, tax, total, status, issued_date, due_date) VALUES
  ('b50e8400-e29b-41d4-a716-446655440001'::uuid, 'INV-2026-0001', '750e8400-e29b-41d4-a716-446655440001'::uuid, 1329.98, 132.99, 1462.97, 'issued', '2026-02-05', '2026-03-05'),
  ('b50e8400-e29b-41d4-a716-446655440002'::uuid, 'INV-2026-0002', '750e8400-e29b-41d4-a716-446655440002'::uuid, 199.96, 17.99, 197.95, 'paid', '2026-02-05', '2026-03-05'),
  ('b50e8400-e29b-41d4-a716-446655440003'::uuid, 'INV-2026-0003', '750e8400-e29b-41d4-a716-446655440003'::uuid, 449.99, 45, 494.99, 'paid', '2026-02-05', '2026-03-05');
