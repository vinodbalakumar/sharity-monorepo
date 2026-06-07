# Technical Specifications - Sharity MVP

**Version:** 1.0  
**Last Updated:** June 7, 2026  
**Status:** Phase 1 Complete

---

## 🔧 TECHNOLOGY STACK

### Frontend
```
Language: TypeScript (strict mode)
Framework: React Native Expo
UI Library: Tamagui + Custom AppButton/AppCard/etc.
Navigation: Expo Router
State Management: Legend-State
Local Storage: MMKV (encrypted) + AsyncStorage fallback
Secure Storage: Expo SecureStore

Testing:
  - Unit: Jest
  - Integration: Detox
  - E2E: Cypress (web)

Performance:
  - Bundle size: < 200KB (gzipped)
  - Startup: < 2s
  - Navigation: < 300ms
  - Image load: < 1s (mobile)
```

### Backend Services
```
Language: Java 21
Framework: Spring Boot 3.x
Build Tool: Maven
Logging: SLF4J + Logback
Testing: JUnit 5, Mockito, Testcontainers

Data Access:
  - ORM: Spring Data JPA + Hibernate
  - Database: MySQL 8.0
  - Migrations: Flyway
  - Connection Pool: HikariCP

Caching:
  - Distributed: Redis
  - In-memory: Spring Cache

Message Queue:
  - RabbitMQ 3.x
  - Event streaming, async jobs

Security:
  - Spring Security 6.x
  - OAuth2 Resource Server
  - JWT (HS256 / RS256)
  - Password hashing: BCrypt
  - CORS configuration

API Documentation:
  - Swagger/OpenAPI 3.0
  - SpringDoc OpenAPI
```

### Infrastructure
```
Containerization: Docker + Docker Compose
Reverse Proxy: Nginx 1.24+
CDN: Cloudflare (global edge caching)
Object Storage: Cloudflare R2 (S3-compatible)
Hosting: IONOS VPS (Linux Ubuntu 22.04)

Security:
  - Firewall: UFW (port 80, 443, 22/Tailscale only)
  - VPN: Tailscale (private network)
  - SSL/TLS: Cloudflare (auto-renewed)
  - Certificates: Let's Encrypt (backup)

External Integrations:
  - Authentication: Google OAuth, Apple OAuth
  - Payment: PayPal (Sandbox/Live)
  - Email: SMTP (SendGrid or similar)
  - Analytics: (Optional) Mixpanel / Segment
```

---

## 📐 CODE ORGANIZATION

### Frontend Structure
```
src/
├── components/
│   ├── appShell/          (Mandatory layout)
│   │   └── InteriorShell.tsx
│   ├── ui/                (Consolidated components)
│   │   ├── AppButton.tsx
│   │   ├── AppCard.tsx
│   │   ├── AppBadge.tsx
│   │   ├── AppTextInput.tsx
│   │   └── index.ts
│   └── common/            (Reusable utilities)
│
├── features/              (Feature modules)
│   ├── auth/              (40 screens)
│   ├── home/
│   ├── marketplace/
│   ├── products/
│   ├── cart/
│   ├── checkout/
│   ├── payment/
│   ├── orders/
│   ├── seller/
│   ├── wallet/
│   └── ... (other features)
│
├── services/              (API clients)
│   ├── authApi.ts
│   ├── marketplaceApi.ts
│   ├── cartApi.ts
│   ├── ordersApi.ts
│   └── paymentApi.ts
│
├── state/                 (State management)
│   └── appState.ts
│
├── theme/                 (Design tokens)
│   ├── colors.ts
│   ├── spacing.ts
│   └── typography.ts
│
├── types/                 (TypeScript types)
│   ├── navigation.ts
│   ├── api.ts
│   ├── models.ts
│   └── index.ts
│
└── App.tsx               (Entry point)
```

### Backend Structure
```
authorization-server/
├── controller/
│   ├── AuthController.java
│   ├── UserController.java
│   └── AdminController.java
├── service/
│   ├── AuthService.java
│   ├── UserService.java
│   ├── JwtService.java
│   └── EmailService.java
├── model/
│   ├── User.java
│   ├── Role.java
│   └── Token.java
├── repository/
│   ├── UserRepository.java
│   └── TokenRepository.java
└── config/
    ├── SecurityConfig.java
    ├── JwtConfig.java
    └── CorsConfig.java

marketplace-service/
├── controller/
│   ├── MarketplaceController.java
│   ├── CategoryController.java
│   ├── ProductController.java
│   └── SellerController.java
├── service/
│   ├── MarketplaceService.java
│   ├── ProductService.java
│   └── SellerService.java
├── model/
│   ├── Product.java
│   ├── Category.java
│   ├── Seller.java
│   └── Listing.java
├── repository/
│   ├── ProductRepository.java
│   ├── CategoryRepository.java
│   └── SellerRepository.java
└── config/
    └── MarketplaceConfig.java

(Similar structure for payment-service, order-service, wallet-service)
```

---

## 🔌 API DESIGN

### Endpoint Patterns
```
Base URLs:
  Auth: /authorization-server/api/v1/auth
  Marketplace: /marketplace-service/api/v1/marketplace
  Payment: /payment-service/api/v1/payment
  Orders: /order-service/api/v1/orders
  Wallet: /wallet-service/api/v1/wallet

Request/Response Format:
  Content-Type: application/json
  HTTP Status Codes:
    - 200: OK
    - 201: Created
    - 400: Bad Request
    - 401: Unauthorized
    - 403: Forbidden
    - 404: Not Found
    - 409: Conflict
    - 500: Internal Server Error

Authentication:
  Header: Authorization: Bearer {jwt_token}
  JWT contains: userId, email, roles, iat, exp

Response Envelope:
  {
    "success": true,
    "data": { ... },
    "errors": null,
    "timestamp": "2026-06-07T10:30:00Z"
  }

Pagination:
  Query params: page=0&size=20&sort=createdAt,desc
  Response includes: content[], totalElements, totalPages, hasNext
```

### Example Endpoints
```
Authentication:
  POST /auth/register
  POST /auth/login
  POST /auth/logout
  POST /auth/refresh-token
  POST /auth/social/google
  POST /auth/social/apple

Marketplace:
  GET /marketplace/home
  GET /marketplace/categories
  GET /marketplace/products?category={id}&search={query}
  GET /marketplace/products/{id}
  GET /marketplace/sellers/{id}

Cart:
  GET /cart
  POST /cart/add-item
  PUT /cart/update-item/{id}
  DELETE /cart/remove-item/{id}
  POST /cart/apply-coupon

Checkout:
  POST /checkout/create
  POST /checkout/validate
  GET /checkout/summary

Payment:
  POST /payment/authorize (PayPal)
  POST /payment/capture
  POST /payment/refund
  GET /payment/history

Orders:
  GET /orders
  GET /orders/{id}
  POST /orders/{id}/track
  POST /orders/{id}/refund-request

Wallet:
  GET /wallet/balance
  GET /wallet/earnings
  GET /wallet/payout-history
  POST /wallet/request-payout
```

---

## 📊 Data Models

### Core Entities
```
User:
  - userId (UUID)
  - email (unique)
  - passwordHash (BCrypt)
  - firstName, lastName
  - country, phone
  - profileImageUrl
  - roles (BUYER, SELLER)
  - createdAt, updatedAt

Product:
  - productId (UUID)
  - sellerId (FK)
  - name, description
  - category (DIGITAL, PHYSICAL, etc.)
  - price, originalPrice
  - inventory (if physical)
  - imageUrls (stored in R2)
  - status (ACTIVE, INACTIVE, DELETED)
  - createdAt, updatedAt

Order:
  - orderId (UUID)
  - buyerId (FK)
  - sellerId (FK)
  - items (OrderItem[])
  - totalAmount, taxes, fees
  - status (PENDING, AUTHORIZED, CAPTURED, SHIPPED, DELIVERED)
  - paymentMethod (PAYPAL)
  - shippingAddress
  - createdAt, updatedAt

Payment:
  - paymentId (UUID)
  - orderId (FK)
  - amount
  - status (AUTHORIZED, CAPTURED, REFUNDED)
  - paymentMethodId (PayPal token ID)
  - transactionId (from PayPal)
  - createdAt, updatedAt

Seller:
  - sellerId (UUID)
  - userId (FK)
  - businessName
  - bankAccount (encrypted)
  - status (PENDING, VERIFIED, SUSPENDED)
  - earnings, payoutHistory
  - createdAt, updatedAt
```

---

## 🔐 Security Best Practices

### Implemented
```
✅ HTTPS/TLS 1.3 (minimum)
✅ JWT token-based authentication
✅ Spring Security for authorization
✅ CORS configured (localhost + production domain)
✅ CSRF protection (for web forms)
✅ Input validation & sanitization
✅ SQL injection prevention (parameterized queries)
✅ XSS prevention (output encoding)
✅ Password hashing (BCrypt, 12 rounds)
✅ Secure cookie settings (HttpOnly, Secure, SameSite)
✅ Rate limiting (nginx + Spring)
✅ Request/response logging
✅ Audit logging (sensitive operations)
```

### To Implement (Phase 2+)
```
⏳ Web Application Firewall (WAF) rules
⏳ DDoS protection (Cloudflare advanced)
⏳ API key rotation
⏳ Secrets management (HashiCorp Vault)
⏳ Code signing (CI/CD)
⏳ Dependency scanning (OWASP)
⏳ Penetration testing
⏳ Bug bounty program
```

---

## 🧪 Testing Strategy

### Unit Testing
```
Frontend:
  - Component rendering tests
  - Hook behavior (useState, useCallback, etc.)
  - Service function tests
  - Target: 70%+ coverage

Backend:
  - Service layer logic
  - Repository queries (with H2 in-memory DB)
  - Utility functions
  - Target: 80%+ coverage
```

### Integration Testing
```
Frontend:
  - Screen flow testing (Detox)
  - API mock integration
  - State management
  - Navigation between screens

Backend:
  - API endpoint testing (MockMvc)
  - Database transactions
  - Service-to-service interaction
  - RabbitMQ message consumption
```

### E2E Testing
```
Frontend (Cypress):
  - Full user flows (login → purchase → order)
  - Error scenarios
  - Network failure recovery
  - Payment simulation

Backend:
  - Full API flows
  - External service integration (PayPal sandbox)
  - Concurrent request handling
  - Load testing (k6 or JMeter)
```

---

## 📈 Performance Benchmarks

### Frontend
```
Metric                    Target      Measurement
─────────────────────────────────────────────────
App startup               < 2s        From tap to screen
Screen transition         < 300ms     From navigation to render
Image load                < 1s        Mobile on 4G
List rendering (100 items) 60fps      Smooth scrolling
Bundle size               < 200KB     Gzipped
Memory usage              < 100MB     Peak usage
```

### Backend
```
Metric                    Target      Measurement
─────────────────────────────────────────────────
API response              < 500ms     p95 latency
Database query            < 100ms     p95 latency
Auth token validation     < 10ms      Per request
Cache hit ratio           > 80%       Redis hits
Concurrent users          10,000      Simultaneous
Requests/second           1,000 QPS   Sustained
```

---

## 🔄 Deployment Process

### Local Development
```
1. Clone repo
2. docker-compose up
3. Services start automatically
4. npm run dev (frontend)
5. Access http://localhost:3000
```

### Staging
```
1. Push to staging branch
2. GitHub Actions: build & test
3. Docker images pushed to registry
4. Deploy to staging environment
5. Run smoke tests
6. Manual testing
```

### Production
```
1. Create pull request to main
2. Code review approval
3. GitHub Actions: build & test
4. Manual approval for deployment
5. Rolling update (zero downtime)
6. Monitoring & health checks
7. Rollback on failure (automated)
```

---

**Status:** ✅ Ready for Phase 2 Implementation  
**Last Updated:** June 7, 2026
