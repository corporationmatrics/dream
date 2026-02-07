-- Create performance indexes for product search
CREATE INDEX products_name_search_idx ON products USING GIN(to_tsvector('english', name));
CREATE INDEX products_description_search_idx ON products USING GIN(to_tsvector('english', description));
CREATE INDEX products_category_idx ON products(category);
CREATE INDEX products_price_idx ON products(CAST(price AS NUMERIC));
CREATE INDEX products_stock_idx ON products(stock);
CREATE INDEX products_status_idx ON products(status);
CREATE INDEX products_created_at_idx ON products(created_at DESC);

-- Analyze tables for query optimization
ANALYZE products;
