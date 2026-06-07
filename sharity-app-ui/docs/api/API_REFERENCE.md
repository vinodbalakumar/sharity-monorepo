# API Reference - Sharity MVP

**Version:** 1.0  
**Last Updated:** June 7, 2026  
**Base URLs:**
- Auth: `http://localhost:8001/authorization-server/api/v1`
- Marketplace: `http://localhost:8002/marketplace-service/api/v1`
- Payment: `http://localhost:8003/payment-service/api/v1`

---

## Authentication Endpoints

### Register User
```
POST /auth/register
Content-Type: application/json

Request:
{
  "email": "user@example.com",
  "password": "secure-password",
  "firstName": "John",
  "lastName": "Doe",
  "country": "US",
  "phone": "+1234567890"
}

Response (201):
{
  "success": true,
  "data": {
    "userId": "uuid",
    "email": "user@example.com",
    "token": "jwt-token"
  }
}
```

### Login
```
POST /auth/login
Content-Type: application/json

Request:
{
  "email": "user@example.com",
  "password": "secure-password"
}

Response (200):
{
  "success": true,
  "data": {
    "accessToken": "jwt-token",
    "refreshToken": "refresh-token",
    "expiresIn": 3600
  }
}
```

### Logout
```
POST /auth/logout
Authorization: Bearer {jwt-token}

Response (200):
{
  "success": true,
  "data": null
}
```

### Refresh Token
```
POST /auth/refresh-token
Content-Type: application/json

Request:
{
  "refreshToken": "refresh-token"
}

Response (200):
{
  "success": true,
  "data": {
    "accessToken": "new-jwt-token",
    "refreshToken": "new-refresh-token",
    "expiresIn": 3600
  }
}
```

---

## Marketplace Endpoints

### Get Home Data
```
GET /marketplace/home
Authorization: Bearer {jwt-token}

Response (200):
{
  "success": true,
  "data": {
    "categories": [...],
    "featuredProducts": [...],
    "recommendations": [...]
  }
}
```

### Get Products
```
GET /marketplace/products?category={id}&search={query}&page=0&size=20
Authorization: Bearer {jwt-token}

Response (200):
{
  "success": true,
  "data": {
    "content": [...],
    "totalElements": 100,
    "totalPages": 5,
    "currentPage": 0,
    "hasNext": true
  }
}
```

### Get Product Details
```
GET /marketplace/products/{productId}
Authorization: Bearer {jwt-token}

Response (200):
{
  "success": true,
  "data": {
    "productId": "uuid",
    "name": "Product Name",
    "description": "...",
    "price": 99.99,
    "images": [...],
    "seller": {...},
    "reviews": [...]
  }
}
```

---

## Cart Endpoints

### Get Cart
```
GET /cart
Authorization: Bearer {jwt-token}

Response (200):
{
  "success": true,
  "data": {
    "cartId": "uuid",
    "items": [...],
    "total": 299.99,
    "count": 3
  }
}
```

### Add to Cart
```
POST /cart/add-item
Authorization: Bearer {jwt-token}
Content-Type: application/json

Request:
{
  "productId": "uuid",
  "quantity": 2
}

Response (201):
{
  "success": true,
  "data": {
    "cartId": "uuid",
    "itemCount": 3
  }
}
```

---

## Payment Endpoints

### Authorize Payment
```
POST /payment/authorize
Authorization: Bearer {jwt-token}
Content-Type: application/json

Request:
{
  "orderId": "uuid",
  "amount": 299.99,
  "paymentMethod": "PAYPAL",
  "paypalOrderId": "paypal-order-id"
}

Response (200):
{
  "success": true,
  "data": {
    "paymentId": "uuid",
    "authorizationToken": "paypal-token",
    "status": "AUTHORIZED"
  }
}
```

### Capture Payment
```
POST /payment/capture
Authorization: Bearer {jwt-token}
Content-Type: application/json

Request:
{
  "paymentId": "uuid",
  "authorizationToken": "paypal-token"
}

Response (200):
{
  "success": true,
  "data": {
    "paymentId": "uuid",
    "transactionId": "paypal-transaction-id",
    "status": "CAPTURED"
  }
}
```

---

## Order Endpoints

### Get Orders
```
GET /orders?page=0&size=20
Authorization: Bearer {jwt-token}

Response (200):
{
  "success": true,
  "data": {
    "content": [...],
    "totalPages": 5,
    "currentPage": 0
  }
}
```

### Get Order Details
```
GET /orders/{orderId}
Authorization: Bearer {jwt-token}

Response (200):
{
  "success": true,
  "data": {
    "orderId": "uuid",
    "items": [...],
    "total": 299.99,
    "status": "DELIVERED",
    "tracking": "..."
  }
}
```

---

**Status:** ✅ Ready for Phase 2  
**Last Updated:** June 7, 2026
