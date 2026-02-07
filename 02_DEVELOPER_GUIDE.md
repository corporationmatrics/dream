# 👨‍💻 Dream ERP Platform - Developer Guide

**Target Audience:** Backend, Frontend, and Full-stack Developers  
**Updated:** February 7, 2026

---

## 🚀 Quick Start (30 Minutes)

### Prerequisites
```bash
# Required
- Node.js 18+
- Docker & Docker Compose
- Git
- PostgreSQL Client Tools (psql)

# Optional
- Postman / Insomnia (API testing)
- VS Code with extensions
- K3s Desktop (for Kubernetes testing)
```

### Local Setup

```bash
# 1. Clone repository
git clone https://github.com/dream-erp/platform.git
cd dream-erp

# 2. Install dependencies
npm install
cd erp-api && npm install && cd ..
cd erp-accounting && npm install && cd ..
cd erp-web && npm install && cd ..

# 3. Start Docker containers
docker-compose up -d

# 4. Run database migrations
npm run migrate

# 5. Seed test data
npm run seed

# 6. Start development servers
# Terminal 1: Backend API (NestJS)
npm run dev:api

# Terminal 2: Accounting Service (Spring)
npm run dev:accounting

# Terminal 3: Frontend
npm run dev:web

# 7. Access services
- Frontend: http://localhost:3000
- API: http://localhost:3001
- Accounting: http://localhost:8080
- Swagger Docs: http://localhost:3001/swagger
```

### First API Call

```bash
# 1. Register user
curl -X POST http://localhost:3001/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "SecurePass123!",
    "firstName": "John",
    "lastName": "Doe"
  }'

# 2. Login & get token
TOKEN=$(curl -X POST http://localhost:3001/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com", "password": "SecurePass123!"}' \
  | jq -r '.token')

# 3. Get user profile
curl http://localhost:3001/users/profile \
  -H "Authorization: Bearer $TOKEN"
```

---

## 📁 Project Structure

```
dream-erp/
│
├── erp-api/                    # NestJS Backend (Port 3001)
│   ├── src/
│   │   ├── modules/
│   │   │   ├── auth/           # Authentication & JWT
│   │   │   ├── users/          # User management
│   │   │   ├── products/       # Products & inventory
│   │   │   ├── orders/         # Orders & fulfillment
│   │   │   ├── b2b/            # B2B integration (Phase 1.5+)
│   │   │   │   ├── po-intake/  # Purchase order ingestion
│   │   │   │   ├── invoices/   # Invoice generation
│   │   │   │   └── webhooks/   # Webhook delivery & retry
│   │   │   └── common/         # Shared utilities, guards, interceptors
│   │   ├── database/
│   │   │   ├── migrations/     # Database migrations
│   │   │   └── seeds/          # Test data
│   │   ├── config/             # Configuration files
│   │   ├── app.module.ts       # Main application module
│   │   └── main.ts             # Entry point
│   ├── test/
│   │   ├── unit/               # Unit tests (.spec.ts)
│   │   ├── integration/        # Integration tests (.e2e-spec.ts)
│   │   └── fixtures/           # Test data
│   ├── docker-compose.yml      # Local dev environment
│   ├── Dockerfile              # Production image
│   └── package.json
│
├── erp-accounting/             # Spring Boot Backend (Port 8080)
│   ├── src/
│   │   ├── main/
│   │   │   ├── java/com/dream/
│   │   │   │   ├── accounting/ # GL posting service
│   │   │   │   ├── ledger/     # Ledger management
│   │   │   │   ├── reports/    # Financial reports
│   │   │   │   └── controller/ # REST endpoints
│   │   │   └── resources/
│   │   │       ├── application.properties
│   │   │       └── db/migration/ # Flyway migrations
│   │   └── test/
│   ├── Dockerfile
│   ├── pom.xml
│   └── README.md
│
├── erp-web/                    # Next.js Frontend (Port 3000)
│   ├── src/
│   │   ├── app/                # Next.js pages & layouts
│   │   ├── components/         # React components
│   │   │   ├── Auth/
│   │   │   ├── Products/
│   │   │   ├── Orders/
│   │   │   ├── Dashboard/
│   │   │   └── B2B/ (Phase 1.5+)
│   │   ├── hooks/              # Custom React hooks
│   │   ├── lib/
│   │   │   ├── api.ts          # API client wrapper
│   │   │   ├── auth.ts         # Auth utilities
│   │   │   └── utils.ts        # Helper functions
│   │   └── styles/             # Tailwind CSS
│   ├── public/                 # Static assets
│   ├── tests/                  # Jest + React Testing Library
│   ├── package.json
│   └── next.config.js
│
├── .github/workflows/          # CI/CD Pipelines
│   ├── test.yml                # Automated testing
│   ├── build.yml               # Docker image building
│   ├── deploy.yml              # K3s deployment
│   ├── load-test.yml           # Performance testing
│   └── compliance.yml          # Security scanning
│
├── k8s/                        # Kubernetes manifests
│   ├── deployments/
│   │   ├── api-production.yaml
│   │   └── accounting-production.yaml
│   ├── helm/
│   │   ├── postgres-values.yaml
│   │   └── valkey-values.yaml
│   └── monitoring/
│       └── prometheus-rules.yaml
│
├── docker-compose.yml          # Complete dev environment
└── README.md
```

---

## 🏗️ Technology Stack Deep Dive

### Backend: NestJS (Node.js 18+)

**Why NestJS?**
- Dependency Injection & modular architecture
- Built-in microservices support
- TypeScript-first development
- Decorators for clean, declarative code
- Excellent testing utilities

**Installation & Setup:**

```bash
npm i -g @nestjs/cli

# New NestJS project
nest new erp-api

# Generate new module
nest generate module products
nest generate service products
nest generate controller products
```

**Core Concepts:**

```typescript
// 1. Modules (organize features)
@Module({
  imports: [TypeOrmModule.forFeature([Product])],
  controllers: [ProductsController],
  providers: [ProductsService],
})
export class ProductsModule {}

// 2. Services (business logic)
@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private repo: Repository<Product>,
    private logger: Logger,
  ) {}

  async create(dto: CreateProductDto): Promise<Product> {
    this.logger.log(`Creating product: ${dto.name}`);
    return this.repo.save(dto);
  }
}

// 3. Controllers (HTTP endpoints)
@Controller('products')
export class ProductsController {
  constructor(private service: ProductsService) {}

  @Post()
  @HttpCode(201)
  async create(@Body() dto: CreateProductDto) {
    return this.service.create(dto);
  }

  @Get(':id')
  async getById(@Param('id') id: string) {
    return this.service.findById(id);
  }
}

// 4. DTOs (Data validation)
export class CreateProductDto {
  @IsString()
  @MinLength(3)
  name: string;

  @IsNumber()
  @Min(0)
  price: number;

  @IsString()
  sku: string;
}
```

**Common Patterns:**

```typescript
// Exception handling
throw new BadRequestException('Invalid product SKU');
throw new NotFoundException('Product not found');
throw new ConflictException('Product already exists');

// Authentication guard
@UseGuards(JwtAuthGuard)
@Post()
async create(@Body() dto: CreateProductDto) { ... }

// Interceptors (logging, transformation)
@UseInterceptors(LoggingInterceptor)
@Post()
async create(@Body() dto: CreateProductDto) { ... }

// Pipes (validation)
@UsePipes(new ValidationPipe())
@Post()
async create(@Body() dto: CreateProductDto) { ... }
```

### Backend: Spring Boot 3.x (Java 21)

**Purpose:** Core accounting & ledger posting  
**Port:** 8080

**Key Components:**

```java
// Entity mapping
@Entity
@Table(name = "gl_accounts")
public class GLAccount {
    @Id
    @GeneratedValue
    private Long id;
    
    @Column(unique = true)
    private String code;
    
    private String name;
    private AccountType type;
    private BigDecimal balance;
}

// Service layer
@Service
@Transactional
public class LedgerService {
    
    @Autowired
    private LedgerRepository ledgerRepo;
    
    public void postEntry(LedgerEntry entry) {
        // ACID transaction guaranteed
        ledgerRepo.save(entry);
    }
}

// REST Controllers
@RestController
@RequestMapping("/api/ledger")
public class LedgerController {
    
    @PostMapping("/entries")
    public ResponseEntity<LedgerEntry> post(@RequestBody PostEntryDto dto) {
        return ResponseEntity.ok(service.postEntry(dto));
    }
}
```

### Frontend: Next.js 14 + React 18

**Why Next.js?**
- Server-side rendering (SSR) for SEO
- Static site generation (SSG) for performance
- Built-in API routes
- Image optimization
- Zero-config setup

**Key Features:**

```typescript
// 1. App Router (Next.js 13+)
src/app/
├── layout.tsx           # Root layout
├── page.tsx             # Home page
├── products/
│   ├── page.tsx         # Products list
│   ├── [id]/
│   │   └── page.tsx     # Product detail (dynamic route)
│   └── new/
│       └── page.tsx     # Create product form
└── api/                 # API routes
    └── products/
        └── route.ts     # /api/products

// 2. Components (React 18)
'use client'  // Client component (browser-side)

export default function ProductCard({ product }) {
  const [loading, setLoading] = useState(false);
  
  const handleDelete = async () => {
    setLoading(true);
    await deleteProduct(product.id);
    setLoading(false);
  };
  
  return (
    <div className="card">
      <h3>{product.name}</h3>
      <p>₹{product.price}</p>
      <button onClick={handleDelete} disabled={loading}>
        {loading ? 'Deleting...' : 'Delete'}
      </button>
    </div>
  );
}

// 3. Server Components (default, server-side)
export default async function ProductsPage() {
  const products = await fetch('...').then(r => r.json());
  
  return (
    <div>
      {products.map(p => <ProductCard key={p.id} product={p} />)}
    </div>
  );
}

// 4. API Routes
// src/app/api/products/route.ts
export async function GET(req: NextRequest) {
  const products = await db.products.findAll();
  return NextResponse.json(products);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const product = await db.products.create(body);
  return NextResponse.json(product, { status: 201 });
}
```

---

## 🗄️ Database Schema

### PostgreSQL Tables (v15+)

```sql
-- Users & Authentication
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  role VARCHAR(50) DEFAULT 'user',  -- admin, manager, user
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Products & Catalog
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sku VARCHAR(100) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  price NUMERIC(12,2) NOT NULL,
  tax_code VARCHAR(50),  -- For GST calculations
  hsn_code VARCHAR(10),  -- Harmonized System of Nomenclature
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT NOW(),
  created_by UUID REFERENCES users(id)
);

-- Inventory by Warehouse
CREATE TABLE inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  warehouse_id UUID NOT NULL,
  product_id UUID NOT NULL REFERENCES products(id),
  quantity_on_hand INT DEFAULT 0,
  quantity_reserved INT DEFAULT 0,
  reorder_level INT,
  last_counted_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(warehouse_id, product_id)
);

-- Orders
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number VARCHAR(50) UNIQUE NOT NULL,
  customer_id UUID NOT NULL REFERENCES users(id),
  status VARCHAR(50),  -- new, processing, shipped, delivered
  total_amount NUMERIC(14,2),
  total_tax NUMERIC(14,2),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  created_by UUID REFERENCES users(id)
);

CREATE TABLE order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id),
  quantity INT NOT NULL,
  unit_price NUMERIC(12,2) NOT NULL,
  line_tax NUMERIC(12,2),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Invoicing
CREATE TABLE invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_number VARCHAR(50) UNIQUE NOT NULL,
  order_id UUID REFERENCES orders(id),
  customer_id UUID NOT NULL REFERENCES users(id),
  invoice_date DATE NOT NULL,
  due_date DATE,
  subtotal NUMERIC(14,2),
  tax_amount NUMERIC(14,2),
  total_amount NUMERIC(14,2),
  status VARCHAR(50),  -- draft, issued, paid, overdue
  created_at TIMESTAMP DEFAULT NOW(),
  created_by UUID REFERENCES users(id)
);

-- General Ledger
CREATE TABLE gl_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(20) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  type VARCHAR(50),  -- asset, liability, equity, revenue, expense
  balance NUMERIC(16,2) DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE journal_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entry_date DATE NOT NULL,
  description TEXT,
  reference_id UUID,  -- Links to orders, invoices, etc.
  reference_type VARCHAR(50),
  created_at TIMESTAMP DEFAULT NOW(),
  created_by UUID REFERENCES users(id)
);

CREATE TABLE ledger_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  journal_id UUID NOT NULL REFERENCES journal_entries(id),
  gl_account_id UUID NOT NULL REFERENCES gl_accounts(id),
  debit_amount NUMERIC(14,2),
  credit_amount NUMERIC(14,2),
  entry_order INT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- B2B Integration (Phase 1.5+)
CREATE TABLE b2b_partners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id VARCHAR(100) UNIQUE NOT NULL,
  company_name VARCHAR(255) NOT NULL,
  gst_in VARCHAR(15),
  contact_email VARCHAR(255),
  webhook_url VARCHAR(500),
  webhook_secret VARCHAR(255),
  status VARCHAR(50),  -- active, inactive, suspended
  rate_limit_per_minute INT DEFAULT 100,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE b2b_purchase_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  po_number VARCHAR(100) NOT NULL,
  partner_id UUID NOT NULL REFERENCES b2b_partners(id),
  po_date DATE NOT NULL,
  delivery_date DATE,
  total_amount NUMERIC(14,2),
  currency VARCHAR(3) DEFAULT 'INR',
  po_json JSONB,  -- Full PO payload
  status VARCHAR(50),  -- new, accepted, received, invoiced, completed
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(partner_id, po_number)
);

-- Webhook Management
CREATE TABLE b2b_webhook_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id UUID NOT NULL REFERENCES b2b_partners(id),
  event_type VARCHAR(50),  -- po_received, invoice_generated, etc.
  event_payload JSONB,
  status VARCHAR(50),  -- pending, delivered, failed, dlq
  retry_count INT DEFAULT 0,
  last_attempted_at TIMESTAMP,
  next_retry_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Audit Trail (Immutable)
CREATE TABLE audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type VARCHAR(50),  -- orders, invoices, etc.
  entity_id UUID,
  action VARCHAR(50),  -- create, update, delete
  changes JSONB,  -- Before/after values
  user_id UUID REFERENCES users(id),
  ip_address INET,
  created_at TIMESTAMP DEFAULT NOW(),
  CONSTRAINT immutable_audit CHECK (true)  -- Can't be updated
);

-- Indexes for performance
CREATE INDEX idx_products_sku ON products(sku);
CREATE INDEX idx_orders_customer_id ON orders(customer_id);
CREATE INDEX idx_order_items_order_id ON order_items(order_id);
CREATE INDEX idx_invoices_customer_id ON invoices(customer_id);
CREATE INDEX idx_ledger_entries_account_id ON ledger_entries(gl_account_id);
CREATE INDEX idx_b2b_po_partner_id ON b2b_purchase_orders(partner_id);
CREATE INDEX idx_b2b_webhook_status ON b2b_webhook_queue(status);
CREATE INDEX idx_audit_log_entity ON audit_log(entity_type, entity_id);
```

---

## 🧪 Testing Guide

### Unit Tests (Jest)

```bash
# Run all tests
npm run test

# Run with coverage
npm run test:cov

# Watch mode (auto-rerun on file change)
npm run test:watch

# Run specific test
npm run test -- auth.service.spec.ts
```

**Example Unit Test:**

```typescript
// products.service.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { ProductsService } from './products.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Product } from '../entities/product.entity';

describe('ProductsService', () => {
  let service: ProductsService;
  let mockRepository;

  beforeEach(async () => {
    // Mock the repository
    mockRepository = {
      save: jest.fn(),
      findById: jest.fn(),
      find: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductsService,
        {
          provide: getRepositoryToken(Product),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<ProductsService>(ProductsService);
  });

  it('should create a product', async () => {
    const createDto = { name: 'Widget', price: 99.99, sku: 'WDG-001' };
    mockRepository.save.mockResolvedValue({ id: '1', ...createDto });

    const result = await service.create(createDto);

    expect(result).toEqual({ id: '1', ...createDto });
    expect(mockRepository.save).toHaveBeenCalledWith(createDto);
  });

  it('should throw error for duplicate SKU', async () => {
    const createDto = { name: 'Widget', price: 99.99, sku: 'WDG-001' };
    mockRepository.save.mockRejectedValue(
      new Error('Unique constraint violation')
    );

    await expect(service.create(createDto)).rejects.toThrow();
  });
});
```

### Integration Tests (NestJS + Supertest)

```typescript
// products.controller.e2e-spec.ts
import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from '../app.module';
import * as request from 'supertest';

describe('Products API (e2e)', () => {
  let app: INestApplication;
  let jwtToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    // Login & get token
    const result = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'test@example.com', password: 'test123' });
    jwtToken = result.body.token;
  });

  describe('POST /products', () => {
    it('should create product', () => {
      return request(app.getHttpServer())
        .post('/products')
        .set('Authorization', `Bearer ${jwtToken}`)
        .send({ name: 'Widget', price: 99.99, sku: 'WDG-001' })
        .expect(201)
        .expect((res) => {
          expect(res.body.id).toBeDefined();
          expect(res.body.sku).toBe('WDG-001');
        });
    });

    it('should reject duplicate SKU', () => {
      return request(app.getHttpServer())
        .post('/products')
        .set('Authorization', `Bearer ${jwtToken}`)
        .send({ name: 'Widget', price: 99.99, sku: 'WDG-001' })
        .expect(409);  // Conflict
    });
  });

  describe('GET /products/:id', () => {
    it('should get product by id', () => {
      return request(app.getHttpServer())
        .get('/products/valid-id')
        .set('Authorization', `Bearer ${jwtToken}`)
        .expect(200);
    });

    it('should return 404 for non-existent product', () => {
      return request(app.getHttpServer())
        .get('/products/non-existent-id')
        .set('Authorization', `Bearer ${jwtToken}`)
        .expect(404);
    });
  });

  afterAll(async () => {
    await app.close();
  });
});
```

### Load Tests (K6)

```javascript
// load-tests/products.js
import http from 'k6/http';
import { check } from 'k6';

export const options = {
  vus: 100,             // 100 concurrent virtual users
  duration: '5m',       // 5 minute test
  thresholds: {
    'http_req_duration': ['p(95)<500'],  // 95% of requests < 500ms
    'http_req_failed': ['rate<0.1'],     // Error rate < 10%
  },
};

const BASE_URL = 'http://localhost:3001';

export default function () {
  // Get all products
  const listRes = http.get(`${BASE_URL}/products`);
  check(listRes, {
    'list status is 200': (r) => r.status === 200,
    'list time < 100ms': (r) => r.timings.duration < 100,
  });

  // Get single product
  const getRes = http.get(`${BASE_URL}/products/1`);
  check(getRes, {
    'get status is 200': (r) => r.status === 200,
  });

  // Create product
  const createRes = http.post(`${BASE_URL}/products`, JSON.stringify({
    name: `Product ${__ITER}`,
    price: Math.random() * 1000,
    sku: `SKU-${__ITER}`,
  }), {
    headers: { 'Content-Type': 'application/json' },
  });
  check(createRes, {
    'create status is 201': (r) => r.status === 201,
  });
}
```

---

## 📡 API Documentation

### Authentication

```bash
# 1. Register
POST /auth/register
{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "firstName": "John",
  "lastName": "Doe"
}
Response: 201
{
  "id": "uuid",
  "email": "user@example.com",
  "token": "jwt-token-here"
}

# 2. Login
POST /auth/login
{
  "email": "user@example.com",
  "password": "SecurePass123!"
}
Response: 200
{
  "token": "jwt-token",
  "expiresIn": 3600
}

# 3. Refresh Token
POST /auth/refresh
Header: Authorization: Bearer {token}
Response: 200
{
  "token": "new-jwt-token"
}
```

### Products API

```bash
# List products (with pagination & filters)
GET /products?page=1&limit=10&status=active
Response: 200
{
  "data": [...],
  "meta": {
    "total": 150,
    "page": 1,
    "limit": 10,
    "totalPages": 15
  }
}

# Get single product
GET /products/:id
Response: 200
{ ... product details ... }

# Create product
POST /products
{
  "name": "Widget Pro",
  "sku": "WDG-001",
  "price": 299.99,
  "taxCode": "GST-18%"
}
Response: 201
{ ... created product ... }

# Update product
PATCH /products/:id
{
  "price": 349.99,
  "status": "discontinued"
}
Response: 200
{ ... updated product ... }

# Delete product
DELETE /products/:id
Response: 204 No Content
```

### Orders API

```bash
# Create order
POST /orders
{
  "customerId": "uuid",
  "items": [
    {
      "productId": "uuid",
      "quantity": 5
    }
  ]
}
Response: 201
{
  "id": "order-uuid",
  "orderNumber": "ORD-2026-001234",
  "status": "new",
  "totalAmount": 1499.95,
  "items": [...]
}

# Get order
GET /orders/:id
Response: 200
{ ... full order details ... }

# Update order status
PATCH /orders/:id
{
  "status": "shipped"
}
Response: 200
```

---

## 🔥 Common Development Tasks

### Add a New API Endpoint

```bash
# 1. Generate new feature module
nest generate module features/invoices

# 2. Create entity
// invoices.entity.ts
@Entity()
export class Invoice {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  invoiceNumber: string;

  @ManyToOne(() => Order)
  order: Order;
}

# 3. Create service
nest generate service features/invoices

# 4. Create controller
nest generate controller features/invoices

# 5. Implement service logic
// invoices.service.ts
@Injectable()
export class InvoicesService {
  async create(dto: CreateInvoiceDto): Promise<Invoice> {
    // Business logic
  }
}

# 6. Implement controller
// invoices.controller.ts
@Controller('invoices')
export class InvoicesController {
  @Post()
  async create(@Body() dto: CreateInvoiceDto) {
    return this.service.create(dto);
  }
}

# 7. Add routes to main module
// app.module.ts
@Module({
  imports: [InvoicesModule, ...],
})
export class AppModule {}

# 8. Write tests
npm run test invoices.service.spec.ts
```

### Database Migration

```bash
# 1. Create migration
npm run typeorm migration:create src/database/migrations/AddInvoiceTable

# 2. Edit migration file
// src/database/migrations/xxxx-add-invoice-table.ts
export class AddInvoiceTable1707234567890 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE invoices (...)
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE invoices`);
  }
}

# 3. Run migrations
npm run migrate

# 4. Revert if needed
npm run migrate:revert
```

### Debug Issues

```bash
# 1. Check logs
npm run dev:api    # Watch console output

# 2. Connect to database
psql -h localhost -U postgres -d dream_erp

# Query examples
SELECT * FROM products WHERE sku = 'WDG-001';
SELECT COUNT(*) FROM orders WHERE status = 'new';

# 3. Test API endpoint
curl http://localhost:3001/products \
  -H "Authorization: Bearer {token}"

# With Postman
# Import collection: postman/DreamERP.postman_collection.json

# 4. Check database connections
select * from pg_stat_activity;  -- PostgreSQL
```

---

## 📚 Resources & Documentation

- **NestJS Docs:** https://docs.nestjs.com
- **TypeORM Docs:** https://typeormjs.io
- **Next.js Docs:** https://nextjs.org/docs
- **PostgreSQL Docs:** https://www.postgresql.org/docs
- **Spring Boot Docs:** https://spring.io/projects/spring-boot
- **API Reference:** Swagger at http://localhost:3001/swagger

---

**Last Updated:** February 7, 2026  
**Maintained By:** Backend & Frontend Teams
