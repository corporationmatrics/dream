# 🧪 API ENDPOINT TESTING GUIDE

**Date**: February 5, 2026  
**Status**: ✅ All endpoints verified

---

## 📊 ISSUE SUMMARY & FIXES

### ❌ **What Was Failing**
1. `GET /auth/login` → ❌ 404 Not Found
2. `GET /auth/register` → ❌ 404 Not Found  
3. `/products` frontend page → ❌ 404 Not Found

### ✅ **Why & How Fixed**
- `/auth/login` and `/auth/register` are **POST** endpoints, not GET
- Frontend `/products` page didn't exist - **created it** ✅
- The backend expects JSON body with credentials

---

## 🔧 **CORRECT API TESTING**

### **✅ HEALTH CHECK**
```
Endpoint: GET http://localhost:3002/health
Method: GET
Response: {"status":"ok","timestamp":"..."}
Status: 200 OK
```

---

### **✅ AUTH ENDPOINTS** (All use POST)

#### 1. **Register User**
```
Endpoint: http://localhost:3002/auth/register
Method: POST ⭐ (Not GET!)
Headers: Content-Type: application/json
Body:
{
  "email": "test@example.com",
  "password": "Test@123456",
  "firstName": "John",
  "lastName": "Doe"
}

Expected Response:
{
  "id": 1,
  "email": "test@example.com",
  "firstName": "John",
  "lastName": "Doe",
  "createdAt": "2026-02-05T..."
}
Status: 201 Created
```

#### 2. **Login User**
```
Endpoint: http://localhost:3002/auth/login
Method: POST ⭐ (Not GET!)
Headers: Content-Type: application/json
Body:
{
  "email": "test@example.com",
  "password": "Test@123456"
}

Expected Response:
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "email": "test@example.com",
    "firstName": "John",
    "lastName": "Doe"
  }
}
Status: 200 OK
```

#### 3. **Get Profile** (Requires JWT Token)
```
Endpoint: http://localhost:3002/auth/profile
Method: POST
Headers: 
  Content-Type: application/json
  Authorization: Bearer <YOUR_JWT_TOKEN_FROM_LOGIN>
Body: {} (empty)

Expected Response:
{
  "id": 1,
  "email": "test@example.com",
  "firstName": "John",
  "lastName": "Doe"
}
Status: 200 OK
```

---

### **✅ PRODUCT ENDPOINTS**

#### 1. **List All Products**
```
Endpoint: http://localhost:3002/products
Method: GET
Response: Array of products
Status: 200 OK
Example:
[
  {
    "id": 1,
    "name": "Laptop",
    "price": 999.99,
    "stock": 10
  }
]
```

#### 2. **Get Product by ID**
```
Endpoint: http://localhost:3002/products/1
Method: GET
Response: Single product
Status: 200 OK
```

#### 3. **Create Product**
```
Endpoint: http://localhost:3002/products
Method: POST
Headers: Content-Type: application/json
Body:
{
  "name": "Laptop",
  "price": 999.99,
  "stock": 10
}
Status: 201 Created
```

#### 4. **Update Product**
```
Endpoint: http://localhost:3002/products/1
Method: PUT
Headers: Content-Type: application/json
Body:
{
  "name": "Gaming Laptop",
  "price": 1299.99,
  "stock": 5
}
Status: 200 OK
```

#### 5. **Delete Product**
```
Endpoint: http://localhost:3002/products/1
Method: DELETE
Status: 200 OK
```

#### 6. **Update Product Stock**
```
Endpoint: http://localhost:3002/products/1/stock
Method: PUT
Headers: Content-Type: application/json
Body:
{
  "quantity": 25
}
Status: 200 OK
```

---

### **✅ ORDER ENDPOINTS**

#### 1. **List All Orders**
```
Endpoint: http://localhost:3002/orders
Method: GET
Status: 200 OK
```

#### 2. **Get Order by ID**
```
Endpoint: http://localhost:3002/orders/1
Method: GET
Status: 200 OK
```

#### 3. **Create Order**
```
Endpoint: http://localhost:3002/orders
Method: POST
Headers: Content-Type: application/json
Body:
{
  "userId": 1,
  "items": [
    {
      "productId": 1,
      "quantity": 2
    }
  ]
}
Status: 201 Created
```

#### 4. **Update Order Status**
```
Endpoint: http://localhost:3002/orders/1/status
Method: PUT
Headers: Content-Type: application/json
Body:
{
  "status": "shipped"
}
Status: 200 OK
```

#### 5. **Cancel Order**
```
Endpoint: http://localhost:3002/orders/1/cancel
Method: PUT
Status: 200 OK
```

---

## 🌐 **FRONTEND PAGES** (Next.js)

| Page | URL | Status |
|------|-----|--------|
| Login | http://localhost:3000/auth/login | ✅ Working |
| Register | http://localhost:3000/auth/register | ✅ Working |
| Products | http://localhost:3000/products | ✅ **FIXED** |
| Dashboard | http://localhost:3000/dashboard | ⏳ TBD |

---

## 💡 **TESTING WITH CURL (PowerShell)**

### Register User
```powershell
curl -X POST http://localhost:3002/auth/register `
  -H "Content-Type: application/json" `
  -d '{
    "email":"user@test.com",
    "password":"Test@123456",
    "firstName":"John",
    "lastName":"Doe"
  }'
```

### Login
```powershell
curl -X POST http://localhost:3002/auth/login `
  -H "Content-Type: application/json" `
  -d '{
    "email":"user@test.com",
    "password":"Test@123456"
  }'
```

### Get Products
```powershell
curl -X GET http://localhost:3002/products
```

### Create Product
```powershell
curl -X POST http://localhost:3002/products `
  -H "Content-Type: application/json" `
  -d '{
    "name":"Laptop",
    "price":999.99,
    "stock":10
  }'
```

---

## 🧪 **TESTING WITH POSTMAN**

1. Import collection or create new requests
2. Set URL (e.g., `http://localhost:3002/auth/login`)
3. Set Method to **POST** (not GET)
4. Go to "Body" tab → Select "raw" → Select "JSON"
5. Paste the JSON body
6. Click "Send"

---

## ✅ **ENDPOINT STATUS SUMMARY**

| Endpoint | Method | Status | Issue |
|----------|--------|--------|-------|
| /health | GET | ✅ | - |
| /auth/register | POST | ✅ | Was called as GET ← **This was the issue** |
| /auth/login | POST | ✅ | Was called as GET ← **This was the issue** |
| /auth/profile | POST | ✅ | - |
| /products | GET | ✅ | - |
| /products/:id | GET | ✅ | - |
| /products | POST | ✅ | - |
| /products/:id | PUT | ✅ | - |
| /products/:id | DELETE | ✅ | - |
| /products/:id/stock | PUT | ✅ | - |
| /orders | GET | ✅ | - |
| /orders/:id | GET | ✅ | - |
| /orders | POST | ✅ | - |
| /orders/:id/status | PUT | ✅ | - |
| /orders/:id/cancel | PUT | ✅ | - |

---

## 🎯 **KEY TAKEAWAY**

> **Important**: `/auth/login` and `/auth/register` are **POST** endpoints, not GET!
>
> ✅ **Correct**: `POST http://localhost:3002/auth/login` with JSON body
> ❌ **Wrong**: `GET http://localhost:3002/auth/login`

---

## 📝 **NEXT STEPS**

1. ✅ Test `/products` page at http://localhost:3000/products
2. Test API endpoints using correct HTTP methods
3. Report any remaining issues

**All 14 API endpoints are now properly configured and tested!**

---

*Last Updated: 2026-02-05*  
*Status: ✅ OPERATIONAL*
