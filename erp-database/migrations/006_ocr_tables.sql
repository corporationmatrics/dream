-- Create OCR results tables for different document types

-- Invoice OCR results
CREATE TABLE IF NOT EXISTS invoice_ocr_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    file_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500),
    raw_text TEXT NOT NULL,
    vendor_name VARCHAR(255),
    invoice_number VARCHAR(100),
    invoice_date TIMESTAMP,
    total_amount DECIMAL(12, 2),
    extracted_data JSONB,
    confidence VARCHAR(50),
    processing_status VARCHAR(50) DEFAULT 'completed',
    ocr_provider VARCHAR(100) DEFAULT 'easyocr',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_invoice_ocr_user_id ON invoice_ocr_results(user_id);
CREATE INDEX idx_invoice_ocr_date ON invoice_ocr_results(created_at DESC);
CREATE INDEX idx_invoice_ocr_vendor ON invoice_ocr_results(vendor_name);

-- Receipt OCR results
CREATE TABLE IF NOT EXISTS receipt_ocr_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
    file_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500),
    raw_text TEXT NOT NULL,
    vendor VARCHAR(255),
    receipt_number VARCHAR(100),
    transaction_date TIMESTAMP,
    amount DECIMAL(12, 2),
    payment_method VARCHAR(100),
    extracted_data JSONB,
    verified BOOLEAN DEFAULT FALSE,
    processing_status VARCHAR(50) DEFAULT 'completed',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_receipt_ocr_user_id ON receipt_ocr_results(user_id);
CREATE INDEX idx_receipt_ocr_order_id ON receipt_ocr_results(order_id);
CREATE INDEX idx_receipt_ocr_verified ON receipt_ocr_results(verified);
CREATE INDEX idx_receipt_ocr_date ON receipt_ocr_results(created_at DESC);

-- Barcode scan results
CREATE TABLE IF NOT EXISTS barcode_scans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    barcode_data VARCHAR(255) NOT NULL,
    barcode_type VARCHAR(50),
    scanned_by UUID REFERENCES users(id) ON DELETE SET NULL,
    scan_location VARCHAR(255),
    quantity_scanned INT DEFAULT 1,
    scan_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_barcode_product_id ON barcode_scans(product_id);
CREATE INDEX idx_barcode_data ON barcode_scans(barcode_data);
CREATE INDEX idx_barcode_date ON barcode_scans(scan_date DESC);

-- Product image OCR results
CREATE TABLE IF NOT EXISTS product_image_ocr_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    file_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500),
    raw_text TEXT,
    extracted_product_name VARCHAR(255),
    extracted_sku VARCHAR(100),
    extracted_price DECIMAL(12, 2),
    extracted_description TEXT,
    extracted_data JSONB,
    processing_status VARCHAR(50) DEFAULT 'completed',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_product_image_ocr_product_id ON product_image_ocr_results(product_id);
CREATE INDEX idx_product_image_ocr_user_id ON product_image_ocr_results(user_id);
CREATE INDEX idx_product_image_ocr_date ON product_image_ocr_results(created_at DESC);

-- General document OCR results
CREATE TABLE IF NOT EXISTS document_ocr_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    file_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500),
    file_type VARCHAR(50),
    raw_text TEXT NOT NULL,
    page_count INT,
    extracted_data JSONB,
    processing_status VARCHAR(50) DEFAULT 'completed',
    ocr_provider VARCHAR(100) DEFAULT 'easyocr',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_document_ocr_user_id ON document_ocr_results(user_id);
CREATE INDEX idx_document_ocr_date ON document_ocr_results(created_at DESC);
CREATE INDEX idx_document_ocr_type ON document_ocr_results(file_type);

-- Accounting integration table
CREATE TABLE IF NOT EXISTS ocr_accounting_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_ocr_id UUID REFERENCES invoice_ocr_results(id) ON DELETE CASCADE,
    receipt_ocr_id UUID REFERENCES receipt_ocr_results(id) ON DELETE CASCADE,
    entry_type VARCHAR(50) NOT NULL, -- 'invoice', 'receipt', 'expense'
    vendor_name VARCHAR(255),
    description TEXT,
    amount DECIMAL(12, 2),
    date TIMESTAMP,
    category VARCHAR(100),
    status VARCHAR(50) DEFAULT 'pending', -- pending, verified, booked
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_accounting_entry_type ON ocr_accounting_entries(entry_type);
CREATE INDEX idx_accounting_status ON ocr_accounting_entries(status);
CREATE INDEX idx_accounting_date ON ocr_accounting_entries(date DESC);
CREATE INDEX idx_accounting_created_at ON ocr_accounting_entries(created_at DESC);

-- ANALYZE to update query statistics
ANALYZE invoice_ocr_results;
ANALYZE receipt_ocr_results;
ANALYZE barcode_scans;
ANALYZE product_image_ocr_results;
ANALYZE document_ocr_results;
ANALYZE ocr_accounting_entries;
