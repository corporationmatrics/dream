# ERP Platform - Quick Start & API Testing Guide

**Last Updated**: 2026-02-04 21:10 UTC  
**Status**: 🚀 Active Development

---

## 🎯 What's Running Right Now

```
✅ erp-api (NestJS)         → http://localhost:3002
✅ erp-web (Next.js)        → http://localhost:3000
✅ PostgreSQL 15            → localhost:5432
✅ KeyDB (Redis)            → localhost:6379
✅ MinIO (S3 Storage)       → localhost:9000-9001
✅ Meilisearch              → localhost:7700
```

---

## 🔐 Authentication API

### Register User
```bash
curl -X POST http://localhost:3002/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "SecurePass123!",
    "firstName": "John",
    "lastName": "Doe"
  }'
```

**Response:**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "email": "john@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "role": "user"
  }
}
```

### Login
```bash
curl -X POST http://localhost:3002/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "SecurePass123!"
  }'
```

### Get Profile (Protected)
```bash
curl -X POST http://localhost:3002/auth/profile \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

---

## 📦 Product Management API

### List Products
```bash
# Get first page (10 items)
curl http://localhost:3002/products

# With pagination
curl "http://localhost:3002/products?page=1&limit=20"

# With search
curl "http://localhost:3002/products?search=laptop"
```

### Get Product Details
```bash
curl http://localhost:3002/products/1
```

### Create Product (Admin Only)
```bash
curl -X POST http://localhost:3002/products \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "name": "Laptop",
    "sku": "LAPTOP-001",
    "price": 999.99,
    "quantity": 50,
    "category": "Electronics",
    "description": "High-performance laptop"
  }'
```

### Update Product
```bash
curl -X PUT http://localhost:3002/products/1 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "price": 899.99,
    "quantity": 40
  }'
```

### Delete Product
```bash
curl -X DELETE http://localhost:3002/products/1 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Update Stock
```bash
curl -X PUT http://localhost:3002/products/1/stock \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"quantity": -5}'  # Reduce stock by 5
```

---

## 📋 Order Management API

### Create Order
```bash
curl -X POST http://localhost:3002/orders \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "items": [
      {"productId": 1, "quantity": 2},
      {"productId": 2, "quantity": 1}
    ]
  }'
```

**Response:**
```json
{
  "id": 1,
  "orderNumber": "ORD-1707087014256",
  "userId": 1,
  "items": [
    {
      "id": 1,
      "orderId": 1,
      "productId": 1,
      "quantity": 2,
      "unitPrice": 999.99,
      "lineTotal": 1999.98
    }
  ],
  "subtotal": 1999.98,
  "taxAmount": 199.998,
  "totalAmount": 2199.978,
  "status": "pending"
}
```

### Get My Orders
```bash
curl http://localhost:3002/orders \
  -H "Authorization: Bearer YOUR_TOKEN"

# With pagination
curl "http://localhost:3002/orders?page=1&limit=10" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Get Order Details
```bash
curl http://localhost:3002/orders/1 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Update Order Status
```bash
curl -X PUT http://localhost:3002/orders/1/status \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"status": "confirmed"}'

# Valid statuses: pending, confirmed, shipped, delivered, cancelled
```

### Cancel Order
```bash
curl -X PUT http://localhost:3002/orders/1/cancel \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## 🔧 Using Postman

### 1. Create Environment
- **Variable**: `BASE_URL` = `http://localhost:3002`
- **Variable**: `TOKEN` = (will be set after login)

### 2. Import Requests

**Collection: ERP Platform**

1. **Auth Register**
   - POST `{{BASE_URL}}/auth/register`
   - Body (JSON):
     ```json
     {
       "email": "{{$timestamp}}@test.com",
       "password": "Test@123",
       "firstName": "Test",
       "lastName": "User"
     }
     ```
   - Tests:
     ```javascript
     pm.environment.set("TOKEN", pm.response.json().accessToken);
     ```

2. **Auth Login**
   - POST `{{BASE_URL}}/auth/login`
   - Body:
     ```json
     {"email": "user@example.com", "password": "pass"}
     ```

3. **Get Profile**
   - POST `{{BASE_URL}}/auth/profile`
   - Headers: `Authorization: Bearer {{TOKEN}}`

4. **Create Product**
   - POST `{{BASE_URL}}/products`
   - Headers: `Authorization: Bearer {{TOKEN}}`
   - Body:
     ```json
     {
       "name": "Sample Product",
       "sku": "PROD-{{$timestamp}}",
       "price": 99.99,
       "quantity": 100
     }
     ```

5. **List Products**
   - GET `{{BASE_URL}}/products`

6. **Create Order**
   - POST `{{BASE_URL}}/orders`
   - Headers: `Authorization: Bearer {{TOKEN}}`
   - Body:
     ```json
     {"items": [{"productId": 1, "quantity": 2}]}
     ```

---

## 📊 Database Schema

### Users Table
```
id (PK)
email (UNIQUE)
password
firstName
lastName
role (default: 'user')
isActive (default: true)
createdAt
updatedAt
```

### Products Table
```
id (PK)
name
description
sku (UNIQUE)
price (DECIMAL)
quantity (INT)
category
status (default: 'active')
createdAt
updatedAt
```

### Orders Table
```
id (PK)
orderNumber (UNIQUE)
userId (FK → users)
subtotal (DECIMAL)
discount (DECIMAL)
taxAmount (DECIMAL)
totalAmount (DECIMAL)
status (default: 'pending')
notes
createdAt
updatedAt
```

### OrderItems Table
```
id (PK)
orderId (FK → orders)
productId (FK → products)
quantity
unitPrice
lineTotal
```

---

## 🐛 Troubleshooting

### API Not Running
```powershell
# Check if API is running
netstat -ano | findstr :3002

# Start API
cd erp-api
npm run start:dev
```

### Cannot Connect to Database
```powershell
# Verify PostgreSQL container
docker ps | grep postgres

# Test connection
docker exec erp-infrastructure-postgres-1 psql -U postgres -c "SELECT 1"
```

### JWT Token Errors
- Ensure token is included in Authorization header
- Format: `Authorization: Bearer <token>`
- Check token expiration (default: 3600 seconds = 1 hour)

### Port Already in Use
```powershell
# Find process using port 3002
netstat -ano | findstr :3002

# Kill process (replace PID)
Stop-Process -Id <PID> -Force
```

---

## 🚀 Next Development Steps

1. **Accounting Module** - GL accounts and journal entries
2. **Dashboard UI** - React components for web app
3. **Reports** - Financial statements and business reports
4. **Mobile App** - React Native with Expo
5. **API Documentation** - Swagger/OpenAPI specs

---

## 📚 File Structure Reference

```
erp-api/src/
├── auth/
│   ├── auth.entity.ts
│   ├── auth.service.ts
│   ├── auth.controller.ts
│   ├── auth.module.ts
│   └── strategies/
│       ├── jwt.strategy.ts
│       └── jwt.guard.ts
├── products/
│   ├── product.entity.ts
│   ├── product.service.ts
│   ├── product.controller.ts
│   └── product.module.ts
├── orders/
│   ├── order.entity.ts
│   ├── order-item.entity.ts
│   ├── order.service.ts
│   ├── order.controller.ts
│   └── order.module.ts
├── app.module.ts
├── app.controller.ts
├── app.service.ts
└── main.ts
```

---

## 📞 Environment Variables

See `erp-api/.env`:
```
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USER=postgres
DATABASE_PASSWORD=postgres
DATABASE_NAME=erp_platform

JWT_SECRET=your-secret-key-here
JWT_EXPIRATION=3600

APP_PORT=3002
NODE_ENV=development
```

---

**Happy Testing! 🎉**
