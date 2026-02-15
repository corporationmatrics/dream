-- ============================================================================
-- E-COMMERCE TABLES (Required by NestJS erp-api)
-- ============================================================================
-- This script adds the e-commerce tables expected by the NestJS API
-- These complement the accounting tables already in the database
-- ============================================================================

-- ORDERS TABLE (created by users - customer orders)
CREATE TABLE IF NOT EXISTS public.orders (
    order_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(user_id) ON DELETE CASCADE,
    order_number VARCHAR(100) UNIQUE NOT NULL,
    order_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    subtotal NUMERIC(12, 2) DEFAULT 0,
    discount NUMERIC(10, 2) DEFAULT 0,
    tax_amount NUMERIC(10, 2) DEFAULT 0,
    total_amount NUMERIC(12, 2) DEFAULT 0,
    status VARCHAR(50) DEFAULT 'pending',
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_orders_user_id ON public.orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON public.orders(created_at);
COMMENT ON TABLE orders IS 'E-commerce orders from customers - used by NestJS API';

-- ORDER_ITEMS TABLE (line items in orders)
CREATE TABLE IF NOT EXISTS public.order_items (
    order_item_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES public.orders(order_id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES public.products(product_id) ON DELETE RESTRICT,
    quantity INTEGER NOT NULL,
    unit_price NUMERIC(10, 2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON public.order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON public.order_items(product_id);
COMMENT ON TABLE order_items IS 'Order line items - quantity and price per product';

-- REVIEWS TABLE (product reviews)
CREATE TABLE IF NOT EXISTS public.reviews (
    review_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES public.products(product_id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.users(user_id) ON DELETE CASCADE,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    is_verified BOOLEAN DEFAULT FALSE,
    helpful_count INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(product_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_reviews_product_id ON public.reviews(product_id);
CREATE INDEX IF NOT EXISTS idx_reviews_user_id ON public.reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_reviews_rating ON public.reviews(rating);
COMMENT ON TABLE reviews IS 'Product reviews and ratings from customers';

-- WISHLIST_ITEMS TABLE (product wishlist)
CREATE TABLE IF NOT EXISTS public.wishlist_items (
    wishlist_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(user_id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES public.products(product_id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, product_id)
);

CREATE INDEX IF NOT EXISTS idx_wishlist_user_id ON public.wishlist_items(user_id);
CREATE INDEX IF NOT EXISTS idx_wishlist_product_id ON public.wishlist_items(product_id);
COMMENT ON TABLE wishlist_items IS 'Customer product wishlists';

-- ============================================================================
-- Fix any column mapping issues
-- ============================================================================
COMMENT ON COLUMN users.user_id IS 'Primary key - maps to TypeORM User.id';
COMMENT ON COLUMN products.product_id IS 'Primary key - maps to TypeORM Product.id';
COMMENT ON COLUMN products.product_name IS 'Product name - maps to TypeORM Product.name';
COMMENT ON COLUMN products.product_code IS 'SKU code - maps to TypeORM Product.sku';
COMMENT ON COLUMN products.product_description IS 'Description - maps to TypeORM Product.description';
COMMENT ON COLUMN products.selling_price IS 'Price - maps to TypeORM Product.price';
COMMENT ON COLUMN products.is_active IS 'Status - maps to TypeORM Product.status';

-- ============================================================================
-- Final verification
-- ============================================================================

-- Show all new tables created
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('orders', 'order_items', 'reviews', 'wishlist_items')
ORDER BY table_name;
