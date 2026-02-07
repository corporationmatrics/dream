# ⚡ QUICK REFERENCE - ERP Platform

## 🚀 Running Servers
```powershell
# Terminal 1: API (Port 3002)
cd erp-api
npm run start:dev

# Terminal 2: Web (Port 3000)
cd erp-web
npm run dev

# Terminal 3: Monitor logs
docker-compose -f docker-compose-all-phases.yml logs -f
```

## 🔗 Access Points
```
API:        http://localhost:3002
Web:        http://localhost:3000
Health:     http://localhost:3002/health
Docs:       API_TESTING_GUIDE.md
```

## 🔓 Default Test Account
```
Email: test@example.com
Password: Test@123
(Create via: POST /auth/register)
```

## 📋 Essential API Endpoints

### Auth (Public)
```
POST /auth/register    { email, password, firstName, lastName }
POST /auth/login       { email, password } → { accessToken, user }
POST /auth/profile     (protected) → { user object }
```

### Products (Public read)
```
GET  /products?page=1&limit=10&search=query
GET  /products/:id
POST /products         (protected) { name, sku, price, quantity }
```

### Orders (Protected)
```
GET  /orders
GET  /orders/:id
POST /orders           { items: [{productId, quantity}] }
PUT  /orders/:id/status    { status }
PUT  /orders/:id/cancel
```

## 🔑 Auth Header Format
```
Authorization: Bearer <JWT_TOKEN>
```

## 📊 Database Access
```powershell
# Connect to PostgreSQL
docker exec -it erp-infrastructure-postgres-1 psql -U postgres -d erp_platform

# Common queries
SELECT * FROM users;
SELECT * FROM products;
SELECT * FROM orders;
SELECT * FROM order_items;
```

## 🐛 Troubleshooting

### Port Already in Use
```powershell
netstat -ano | findstr :3002
Stop-Process -Id <PID> -Force
```

### API Won't Start
```powershell
# Check for TypeScript errors
npm run build

# Clear cache
rm -r dist node_modules/.cache
npm install
```

### Database Connection Error
```powershell
docker ps | grep postgres
docker logs erp-infrastructure-postgres-1
```

## 📁 Key Files
```
erp-api/
├── src/auth/auth.service.ts       # JWT logic
├── src/products/product.service.ts # Business logic
├── src/orders/order.service.ts     # Complex logic
├── .env                             # Config
└── tsconfig.json                    # Compiler options

erp-web/
├── src/app/page.tsx                 # Home page
├── src/app/layout.tsx               # Root layout
└── next.config.ts                   # Next config
```

## ⚙️ Environment Variables (erp-api/.env)
```
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USER=postgres
DATABASE_PASSWORD=postgres
DATABASE_NAME=erp_platform
JWT_SECRET=your-secret-key-here
JWT_EXPIRATION=3600
APP_PORT=3002
```

## 🧪 Test Flow

1. **Register User**
   ```bash
   POST /auth/register
   { "email": "test@example.com", "password": "Test@123", 
     "firstName": "Test", "lastName": "User" }
   ```

2. **Login & Get Token**
   ```bash
   POST /auth/login
   { "email": "test@example.com", "password": "Test@123" }
   # Save: accessToken
   ```

3. **Create Product** (with token)
   ```bash
   POST /products
   Headers: Authorization: Bearer <TOKEN>
   { "name": "Laptop", "sku": "LAPTOP-001", "price": 999.99, "quantity": 50 }
   ```

4. **Create Order** (with token)
   ```bash
   POST /orders
   Headers: Authorization: Bearer <TOKEN>
   { "items": [{"productId": 1, "quantity": 2}] }
   ```

## 📊 Module Status
- ✅ **Auth** - Complete (3 endpoints)
- ✅ **Products** - Complete (6 endpoints)
- ✅ **Orders** - Complete (5 endpoints)
- 🚀 **Accounting** - Pending
- 🚀 **Web UI** - Pending

## 💾 Database Tables
| Table | Columns | Status |
|-------|---------|--------|
| users | 8 | ✅ Ready |
| products | 9 | ✅ Ready |
| orders | 10 | ✅ Ready |
| order_items | 7 | ✅ Ready |
| invoices | 5 | ✅ Ready |

## 🔄 Development Cycle
1. Make changes to src/
2. API auto-reloads (watch mode)
3. Test with curl/Postman
4. Check database with psql
5. Commit to git

## 📖 Documentation Files
- `COMPLETE_SETUP_SUMMARY.md` - Full technical overview
- `API_TESTING_GUIDE.md` - How to test every endpoint
- `IMPLEMENTATION_STATUS.md` - Current progress
- `FEATURE_DEVELOPMENT.md` - Roadmap

## 🎯 Next Steps
1. Implement accounting module (GL accounts)
2. Create web dashboard pages
3. Add payment integration
4. Deploy to production

## 🚨 Important Notes
- JWT expires in 1 hour (configurable)
- Orders include 10% tax calculation
- Stock is validated before order creation
- Cancelling orders restores inventory
- Passwords are hashed with bcrypt

---

**API Health**: 🟢 Online  
**Web Status**: 🟢 Running  
**Database**: 🟢 Connected  
**Build**: ✅ 0 Errors  

**Last Updated**: 2026-02-04 21:55 UTC
