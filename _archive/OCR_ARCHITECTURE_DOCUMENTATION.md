# OCR Module Architecture Overview

## Module Structure

```
src/ocr/
├── entities/
│   ├── barcode-scan.entity.ts
│   ├── document-ocr.entity.ts
│   ├── invoice-ocr.entity.ts
│   ├── ocr-accounting.entity.ts
│   ├── product-image-ocr.entity.ts
│   └── receipt-ocr.entity.ts
├── ocr.controller.ts
├── ocr.module.ts
└── ocr.service.ts
```

## Data Flow

### Invoice Processing Flow
```
Client
  ↓
POST /ocr/invoice (with file)
  ↓
OCRController.processInvoice()
  ↓
OCRService.processInvoice()
  ↓
1. Create FormData with file
2. Send to ML API (easyocr/paddle-ocr)
3. Parse response
  ↓
InvoiceOCRResult Entity
  ↓
Database (PostgreSQL)
  ↓
Response to Client
```

### Accounting Integration Flow
```
Invoice/Receipt OCR Results
  ↓
POST /ocr/accounting
  ↓
OCRService.createAccountingEntry()
  ↓
OCRAccountingEntry Entity
  ↓
Links to:
  - InvoiceOCRResult (nullable)
  - ReceiptOCRResult (nullable)
  - Created by User
  ↓
Database
  ↓
Accounting System
```

## Entity Relationships

```
User (auth.entity)
├── InvoiceOCRResult (userId, user)
├── ReceiptOCRResult (userId, user)
├── DocumentOCRResult (userId, user)
├── ProductImageOCRResult (userId, user)
└── OCRAccountingEntry (createdBy, creator)

Product (product.entity)
├── BarcodeScan (productId, product)
└── ProductImageOCRResult (productId, product)

Order (order.entity)
└── ReceiptOCRResult (orderId, order)

OCRAccountingEntry
├── InvoiceOCRResult (invoiceOcrId, invoiceOcr)
└── ReceiptOCRResult (receiptOcrId, receiptOcr)
```

## Database Schema

### invoice_ocr_results
```sql
CREATE TABLE invoice_ocr_results (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL,
  file_name VARCHAR NOT NULL,
  file_path VARCHAR,
  raw_text TEXT NOT NULL,
  vendor_name VARCHAR,
  invoice_number VARCHAR,
  invoice_date TIMESTAMP,
  total_amount DECIMAL(12,2),
  extracted_data JSONB,
  confidence VARCHAR,
  processing_status VARCHAR DEFAULT 'completed',
  ocr_provider VARCHAR DEFAULT 'easyocr',
  created_at TIMESTAMP,
  updated_at TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);
```

### receipt_ocr_results
```sql
CREATE TABLE receipt_ocr_results (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL,
  order_id UUID,
  file_name VARCHAR NOT NULL,
  file_path VARCHAR,
  raw_text TEXT NOT NULL,
  vendor VARCHAR,
  receipt_number VARCHAR,
  transaction_date TIMESTAMP,
  amount DECIMAL(12,2),
  payment_method VARCHAR,
  extracted_data JSONB,
  verified BOOLEAN DEFAULT false,
  processing_status VARCHAR DEFAULT 'completed',
  created_at TIMESTAMP,
  updated_at TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (order_id) REFERENCES orders(id)
);
```

### barcode_scans
```sql
CREATE TABLE barcode_scans (
  id UUID PRIMARY KEY,
  product_id UUID NOT NULL,
  barcode_data VARCHAR NOT NULL,
  barcode_type VARCHAR,
  scanned_by UUID,
  scan_location VARCHAR,
  quantity_scanned INTEGER DEFAULT 1,
  scan_date TIMESTAMP,
  created_at TIMESTAMP,
  FOREIGN KEY (product_id) REFERENCES products(id),
  FOREIGN KEY (scanned_by) REFERENCES users(id)
);
```

### product_image_ocr_results
```sql
CREATE TABLE product_image_ocr_results (
  id UUID PRIMARY KEY,
  product_id UUID,
  user_id UUID NOT NULL,
  file_name VARCHAR NOT NULL,
  file_path VARCHAR,
  raw_text TEXT,
  extracted_product_name VARCHAR,
  extracted_sku VARCHAR,
  extracted_price DECIMAL(12,2),
  extracted_description TEXT,
  extracted_data JSONB,
  processing_status VARCHAR DEFAULT 'completed',
  created_at TIMESTAMP,
  updated_at TIMESTAMP,
  FOREIGN KEY (product_id) REFERENCES products(id),
  FOREIGN KEY (user_id) REFERENCES users(id)
);
```

### document_ocr_results
```sql
CREATE TABLE document_ocr_results (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL,
  file_name VARCHAR NOT NULL,
  file_path VARCHAR,
  file_type VARCHAR,
  raw_text TEXT NOT NULL,
  page_count INTEGER,
  extracted_data JSONB,
  processing_status VARCHAR DEFAULT 'completed',
  ocr_provider VARCHAR DEFAULT 'easyocr',
  created_at TIMESTAMP,
  updated_at TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);
```

### ocr_accounting_entries
```sql
CREATE TABLE ocr_accounting_entries (
  id UUID PRIMARY KEY,
  invoice_ocr_id UUID,
  receipt_ocr_id UUID,
  entry_type VARCHAR NOT NULL, -- 'invoice', 'receipt', 'expense'
  vendor_name VARCHAR,
  description TEXT,
  amount DECIMAL(12,2),
  date TIMESTAMP,
  category VARCHAR,
  status VARCHAR DEFAULT 'pending', -- 'pending', 'verified', 'booked'
  created_by UUID,
  created_at TIMESTAMP,
  updated_at TIMESTAMP,
  FOREIGN KEY (invoice_ocr_id) REFERENCES invoice_ocr_results(id),
  FOREIGN KEY (receipt_ocr_id) REFERENCES receipt_ocr_results(id),
  FOREIGN KEY (created_by) REFERENCES users(id)
);
```

## Service Layer

### OCRService Methods

#### Invoice Processing
```typescript
processInvoice(userId, fileName, fileData): Promise<InvoiceOCRResult>
  - Sends file to ML API
  - Extracts invoice details
  - Stores in database
  - Returns OCR result entity

getInvoiceOCRResults(userId, limit, offset): Promise<InvoiceOCRResult[]>
  - Retrieves user's invoice OCR history
  - Supports pagination
```

#### Receipt Processing
```typescript
processReceipt(userId, fileName, fileData, orderId?): Promise<ReceiptOCRResult>
  - Processes receipt image
  - Extracts transaction details
  - Links to order if provided
  - Stores result

getReceiptOCRResults(userId, limit, offset): Promise<ReceiptOCRResult[]>
  - Retrieves paginated receipt results
```

#### Barcode Scanning
```typescript
scanBarcode(productId, fileData, scannedBy?, scanLocation?): Promise<BarcodeScan>
  - Decodes barcode from image
  - Records scan event
  - Tracks location and user

getBarcodeScans(productId, limit, offset): Promise<BarcodeScan[]>
  - Retrieves scan history for product
  - Ordered by scan date descending
```

#### Product Image Processing
```typescript
processProductImage(userId, fileName, fileData, productId?): Promise<ProductImageOCRResult>
  - Extracts product info from image
  - Identifies name, SKU, price
  - Links to product if provided

getProductImageOCRResults(userId, limit, offset): Promise<ProductImageOCRResult[]>
  - User's product image OCR history
```

#### Document Processing
```typescript
processDocument(userId, fileName, fileData): Promise<DocumentOCRResult>
  - Handles PDF or image documents
  - Extracts text from multiple pages
  - Detects document type

getDocumentOCRResults(userId, limit, offset): Promise<DocumentOCRResult[]>
  - Retrieves document OCR results
```

#### Accounting Integration
```typescript
createAccountingEntry(entryType, vendor, description, amount, date, category, userId, invoiceOcrId?, receiptOcrId?): Promise<OCRAccountingEntry>
  - Creates accounting entry from OCR data
  - Links to source documents
  - Sets initial status to 'pending'

getAccountingEntries(status?, entryType?, limit, offset): Promise<OCRAccountingEntry[]>
  - Filters by status and type
  - Supports pagination

verifyAccountingEntry(entryId): Promise<OCRAccountingEntry>
  - Updates status to 'verified'
  - Prevents duplicate entries
```

## Controller Layer

### OCRController Endpoints

```typescript
@Controller('ocr')
@UseGuards(JwtAuthGuard)
export class OCRController {
  // Invoice endpoints
  POST   /ocr/invoice
  GET    /ocr/invoices
  
  // Receipt endpoints
  POST   /ocr/receipt
  GET    /ocr/receipts
  
  // Barcode endpoints
  POST   /ocr/barcode/:productId
  GET    /ocr/barcodes/:productId
  
  // Product image endpoints
  POST   /ocr/product
  GET    /ocr/products
  
  // Document endpoints
  POST   /ocr/document
  GET    /ocr/documents
  
  // Accounting endpoints
  POST   /ocr/accounting
  GET    /ocr/accounting
  POST   /ocr/accounting/:entryId/verify
}
```

## HTTP Integration

### ML API Communication
```
OCRService → HttpService → ML API
  ↓
Methods: POST
Base URL: process.env.ML_API_URL (default: http://localhost:8000)

Endpoints:
- /ocr/invoice  : Invoice extraction
- /ocr/receipt  : Receipt extraction
- /ocr/barcode  : Barcode decoding
- /ocr/product  : Product info extraction
- /ocr/pdf      : PDF text extraction
- /ocr/text     : Image text extraction

Response Format:
{
  data: {
    // Extracted information
  },
  success: boolean,
  message?: string
}
```

## Error Handling

### Exception Management
```typescript
- HttpException with BAD_REQUEST status
- Detailed error messages
- Proper type checking for error objects
- Logging of errors for debugging
```

### Validation
```typescript
- File existence validation
- OCR processing success check
- Data structure validation
- Date field validation (cannot be null)
```

## Authentication & Authorization

- **Guard**: `JwtAuthGuard` (all endpoints)
- **Decorator**: `@UseGuards(JwtAuthGuard)`
- **User Context**: Available via `@Req() req: any`
- **Data Isolation**: Results filtered by `userId` for security

## Dependencies

### Production
- `@nestjs/common`: Core NestJS functionality
- `@nestjs/typeorm`: ORM integration
- `@nestjs/axios`: HTTP client
- `typeorm`: Database abstraction
- `pg`: PostgreSQL driver

### Development
- `@nestjs/testing`: Testing utilities
- `@types/multer`: Multer type definitions
- `typescript`: TypeScript compiler

## Configuration

### Environment Variables
```
ML_API_URL=http://localhost:8000  # ML service endpoint
DATABASE_URL=postgres://...        # PostgreSQL connection
JWT_SECRET=your_secret_key         # JWT authentication
```

## Performance Optimization

1. **Database Indexes**
   - `ON users.id`
   - `ON products.id`
   - `ON orders.id`
   - `ON ocr_results.user_id`
   - `ON ocr_results.created_at`

2. **Query Optimization**
   - Pagination with offset/limit
   - Sorted by created_at DESC for relevance
   - Eager loading of relationships

3. **File Processing**
   - Async/await for non-blocking operations
   - Stream-based file upload support
   - Configurable file size limits

## Security Measures

1. **Authentication**: JWT-based access control
2. **Authorization**: User-scoped data access
3. **Input Validation**: File type and size checks
4. **Error Messages**: No sensitive data in responses
5. **SQL Injection Prevention**: TypeORM parameterized queries

## Future Enhancements

1. **Webhook Integration**: Async OCR processing notifications
2. **Batch Processing**: Multiple files in single request
3. **Result Caching**: Cache frequently accessed OCR results
4. **Export Formats**: CSV, PDF export of results
5. **Advanced Filtering**: Complex queries on extracted data
6. **Quality Metrics**: Confidence scores and accuracy tracking
7. **Multi-language Support**: OCR for multiple languages
8. **Custom ML Models**: Support for custom OCR models
