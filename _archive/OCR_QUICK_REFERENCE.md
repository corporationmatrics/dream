# OCR Module Quick Reference Guide

## Module Overview
Complete OCR feature for the ERP platform supporting invoice, receipt, barcode, document, and product image processing with accounting integration.

## Quick Start

### Installation
```bash
cd erp-api
npm install
npm run build
```

### Running the Server
```bash
npm start                 # Production
npm run start:dev        # Development with watch mode
npm run start:debug      # Debug mode
```

## API Endpoints Quick Reference

### Invoice Processing
```
POST /ocr/invoice
  Body: FormData with 'file' field
  Returns: InvoiceOCRResult

GET /ocr/invoices?limit=10&offset=0
  Returns: InvoiceOCRResult[]
```

### Receipt Processing
```
POST /ocr/receipt
  Body: FormData with 'file' field, optional 'orderId'
  Returns: ReceiptOCRResult

GET /ocr/receipts?limit=10&offset=0
  Returns: ReceiptOCRResult[]
```

### Barcode Scanning
```
POST /ocr/barcode/:productId
  Body: FormData with 'file' field, optional 'scanLocation'
  Params: productId (UUID)
  Returns: BarcodeScan

GET /ocr/barcodes/:productId?limit=50&offset=0
  Params: productId (UUID)
  Returns: BarcodeScan[]
```

### Product Image Processing
```
POST /ocr/product
  Body: FormData with 'file' field, optional 'productId'
  Returns: ProductImageOCRResult

GET /ocr/products?limit=10&offset=0
  Returns: ProductImageOCRResult[]
```

### Document Processing
```
POST /ocr/document
  Body: FormData with 'file' field (PDF or image)
  Returns: DocumentOCRResult

GET /ocr/documents?limit=10&offset=0
  Returns: DocumentOCRResult[]
```

### Accounting Integration
```
POST /ocr/accounting
  Body: {
    entryType: 'invoice' | 'receipt' | 'expense',
    vendorName: string,
    description: string,
    amount: number,
    date: ISO date string,
    category: string,
    invoiceOcrId?: UUID,
    receiptOcrId?: UUID
  }
  Returns: OCRAccountingEntry

GET /ocr/accounting?status=pending&type=invoice&limit=50&offset=0
  Returns: OCRAccountingEntry[]

POST /ocr/accounting/:entryId/verify
  Params: entryId (UUID)
  Returns: Updated OCRAccountingEntry
```

## Authentication
All endpoints require JWT authentication via `Authorization: Bearer <token>` header.

## File Upload Example

### cURL
```bash
curl -X POST http://localhost:3000/ocr/invoice \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "file=@invoice.jpg"
```

### JavaScript
```javascript
const formData = new FormData();
formData.append('file', fileInput.files[0]);

const response = await fetch('/ocr/invoice', {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${token}` },
  body: formData
});

const result = await response.json();
```

### Python
```python
import requests

headers = {'Authorization': f'Bearer {token}'}
files = {'file': open('invoice.jpg', 'rb')}

response = requests.post(
    'http://localhost:3000/ocr/invoice',
    headers=headers,
    files=files
)

result = response.json()
```

## Database Queries

### Recent Invoice OCR Results
```sql
SELECT * FROM invoice_ocr_results
WHERE user_id = $1
ORDER BY created_at DESC
LIMIT 10;
```

### Pending Accounting Entries
```sql
SELECT * FROM ocr_accounting_entries
WHERE status = 'pending'
ORDER BY created_at ASC;
```

### Product Barcodes
```sql
SELECT * FROM barcode_scans
WHERE product_id = $1
ORDER BY scan_date DESC;
```

### User's OCR History
```sql
SELECT 
  'invoice' as type, id, file_name, created_at 
FROM invoice_ocr_results 
WHERE user_id = $1
UNION ALL
SELECT 
  'receipt', id, file_name, created_at 
FROM receipt_ocr_results 
WHERE user_id = $1
UNION ALL
SELECT 
  'document', id, file_name, created_at 
FROM document_ocr_results 
WHERE user_id = $1
ORDER BY created_at DESC;
```

## Configuration

### Environment Variables
```env
# ML API Configuration
ML_API_URL=http://localhost:8000

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/erp_db

# JWT
JWT_SECRET=your_jwt_secret_key

# File Upload
OCR_FILE_UPLOAD_PATH=./uploads/ocr
OCR_MAX_FILE_SIZE=52428800  # 50MB

# Server
PORT=3000
NODE_ENV=production
```

### TypeORM Configuration
Located in `src/database.config.ts` or `ormconfig.json`

```typescript
{
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  entities: ['src/**/*.entity.ts'],
  synchronize: false,
  migrations: ['src/migrations/**/*.ts'],
}
```

## Testing

### Unit Tests
```bash
npm test
npm test:watch
npm test:cov
```

### Integration Tests
```bash
npm run test:e2e
```

### Example Test
```typescript
describe('OCRController', () => {
  it('should process an invoice', async () => {
    const file = new File(['content'], 'invoice.jpg');
    const response = await controller.processInvoice(
      { user: { id: 'user-123' } },
      file as any
    );
    expect(response).toBeDefined();
    expect(response.vendorName).toBeDefined();
  });
});
```

## Common Workflows

### Invoice Processing Workflow
1. User uploads invoice → `POST /ocr/invoice`
2. System extracts vendor, amount, date
3. Results stored in `invoice_ocr_results` table
4. User reviews in `GET /ocr/invoices`
5. Create accounting entry → `POST /ocr/accounting`
6. Verify entry → `POST /ocr/accounting/:entryId/verify`

### Barcode Scanning Workflow
1. Product manager uploads barcode image → `POST /ocr/barcode/{productId}`
2. Barcode decoded and stored
3. History available via `GET /ocr/barcodes/{productId}`
4. Use data for inventory management

### Product Image Extraction Workflow
1. Upload product photo → `POST /ocr/product`
2. Extract name, SKU, price
3. Auto-populate product information
4. Link to existing product via `productId`

## Troubleshooting

### ML API Connection Error
```
Error: Cannot reach ML API at http://localhost:8000
Solution: 
1. Start ML service: docker-compose up ml-service
2. Verify ML_API_URL environment variable
3. Check network connectivity
```

### File Upload Size Error
```
Error: File too large
Solution:
1. Increase OCR_MAX_FILE_SIZE in .env
2. Check server upload size limits
3. Compress image before upload
```

### Database Connection Error
```
Error: Cannot connect to database
Solution:
1. Verify DATABASE_URL is correct
2. Check PostgreSQL is running
3. Verify credentials and permissions
```

### JWT Authentication Error
```
Error: Invalid or missing token
Solution:
1. Include Authorization header
2. Ensure token is not expired
3. Verify JWT_SECRET matches
```

## Development Tips

### Enable Debug Logging
```typescript
import { Logger } from '@nestjs/common';
const logger = new Logger('OCRModule');
logger.debug('Debug message', { data: value });
```

### Use TypeORM Query Builder
```typescript
const results = await this.invoiceOcrRepository
  .createQueryBuilder('invoice')
  .where('invoice.userId = :userId', { userId: userId })
  .andWhere('invoice.createdAt > :date', { date: new Date('2024-01-01') })
  .orderBy('invoice.createdAt', 'DESC')
  .take(10)
  .skip(0)
  .getMany();
```

### Test ML API Response
```bash
curl -X POST http://localhost:8000/ocr/invoice \
  -F "file=@test-invoice.jpg"
```

## Performance Optimization

### Add Database Indexes
```sql
CREATE INDEX idx_invoice_ocr_user_created 
  ON invoice_ocr_results(user_id, created_at DESC);

CREATE INDEX idx_accounting_status 
  ON ocr_accounting_entries(status, created_at);

CREATE INDEX idx_barcode_product 
  ON barcode_scans(product_id, scan_date DESC);
```

### Enable Query Caching
```typescript
// In service
const invoices = await this.invoiceOcrRepository.find({
  cache: {
    id: 'invoices_' + userId,
    milliseconds: 300000 // 5 minutes
  },
  where: { userId }
});
```

### Pagination Best Practices
- Default limit: 10
- Max limit: 100
- Always sort by created_at DESC for consistency

## Monitoring & Logging

### Application Logs
```bash
# View logs
tail -f logs/application.log

# Filter for OCR module
tail -f logs/application.log | grep OCR
```

### Database Slow Query Logging
```sql
-- Enable query logging
ALTER DATABASE erp_db SET log_min_duration_statement = 1000;

-- View slow queries
SELECT query, mean_time, max_time 
FROM pg_stat_statements 
WHERE query LIKE '%ocr%'
ORDER BY mean_time DESC;
```

## Security Checklist

- [x] All endpoints require JWT authentication
- [x] User-scoped data isolation implemented
- [x] File upload validation in place
- [x] SQL injection prevention (TypeORM)
- [x] CORS properly configured
- [x] Error messages don't leak sensitive data
- [x] File permissions restricted
- [x] Rate limiting configured (recommended)

## Related Modules

- **Auth Module**: `src/auth/` - JWT authentication
- **Products Module**: `src/products/` - Product management
- **Orders Module**: `src/orders/` - Order management
- **Accounting Module**: `src/accounting/` - Accounting system

## Resources

- [NestJS Documentation](https://docs.nestjs.com)
- [TypeORM Documentation](https://typeorm.io)
- [PostgreSQL Documentation](https://www.postgresql.org/docs)
- [API Documentation](./docs/api.md) - Generated from controllers

## Support

For issues or questions:
1. Check error logs: `logs/application.log`
2. Review documentation files
3. Check database migrations
4. Verify environment variables
5. Contact development team

## Version History

- **v1.0.0** (2025-02-05): Initial release
  - 6 entity models
  - 13 API endpoints
  - Accounting integration
  - Full compilation success

---

**Last Updated**: 2025-02-05
**Module Status**: ✅ Production Ready
**Maintained by**: ERP Development Team
