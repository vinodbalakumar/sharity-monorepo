# Sharity MVP - Architecture Documentation

**Version:** 1.0  
**Last Updated:** June 7, 2026  
**Status:** Phase 1 Complete, Production Ready

---

## 🏗️ SYSTEM ARCHITECTURE OVERVIEW

```
┌─────────────────────────────────────────────────────────────────────┐
│                         CLIENT TIER                                  │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │  React Native Expo (Web/Mobile/Tablet)                       │  │
│  │  - TypeScript + Tamagui UI Framework                         │  │
│  │  - Expo Router (Navigation)                                  │  │
│  │  - AppShell Pattern (Unified Layout)                         │  │
│  │  - MMKV (Local Storage) + Secure Store                       │  │
│  └──────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
                                 ↓
┌─────────────────────────────────────────────────────────────────────┐
│                     NETWORK/GATEWAY TIER                             │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │  Cloudflare (DNS, SSL, WAF)                                  │  │
│  │  - DDoS Protection                                           │  │
│  │  - SSL/TLS Termination                                       │  │
│  │  - Global Edge Caching                                       │  │
│  └──────────────────────────────────────────────────────────────┘  │
                                 ↓
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │  Nginx (Reverse Proxy + Load Balancer)                       │  │
│  │  - Port 80/443                                               │  │
│  │  - Request Routing                                           │  │
│  │  - Rate Limiting                                             │  │
│  └──────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
                                 ↓
┌─────────────────────────────────────────────────────────────────────┐
│                    APPLICATION TIER                                  │
│  (Docker Compose on IONOS VPS Linux)                                │
│                                                                      │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │  Service 1: authorization-server (Java 21 + Spring Boot)    │   │
│  │  - Authentication (Email, Google, Apple)                    │   │
│  │  - OAuth2/OIDC Provider                                     │   │
│  │  - JWT Token Generation                                     │   │
│  │  - User Management                                          │   │
│  │  Port: 8001 (Internal)                                      │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                      │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │  Service 2: marketplace-service (Java 21 + Spring Boot)     │   │
│  │  - Product Catalog (Digital + Physical)                     │   │
│  │  - Category Management                                      │   │
│  │  - Search & Filtering                                       │   │
│  │  - Seller Listings                                          │   │
│  │  - Marketplace Configuration                                │   │
│  │  Port: 8002 (Internal)                                      │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                      │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │  Service 3: payment-service (Java 21 + Spring Boot)         │   │
│  │  - Payment Authorization (PayPal)                           │   │
│  │  - Payment Capture                                          │   │
│  │  - Refund Processing                                        │   │
│  │  - Payment History                                          │   │
│  │  Port: 8003 (Internal)                                      │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                      │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │  Service 4: order-service (Future)                          │   │
│  │  - Order Management                                         │   │
│  │  - Order Tracking                                           │   │
│  │  - Fulfillment                                              │   │
│  │  Port: 8004 (Internal)                                      │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                      │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │  Service 5: wallet-service (Future)                         │   │
│  │  - Seller Earnings                                          │   │
│  │  - Payout Management                                        │   │
│  │  - Buyer Credits                                            │   │
│  │  Port: 8005 (Internal)                                      │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                      │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │  Service 6: admin-service (Future)                          │   │
│  │  - Admin Dashboard                                          │   │
│  │  - Configuration Management                                 │   │
│  │  - Analytics                                                │   │
│  │  Port: 8006 (Internal)                                      │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                      │
│  Message Queue & Cache Layer:                                       │
│  ┌──────────────────────┬──────────────────┬──────────────────┐    │
│  │  RabbitMQ            │  Redis (Cache)   │  Message Broker  │    │
│  │  - Event Streaming   │  - Session Store │  - Event Queue   │    │
│  │  - Async Jobs        │  - Cart Cache    │  - Async Tasks   │    │
│  └──────────────────────┴──────────────────┴──────────────────┘    │
└─────────────────────────────────────────────────────────────────────┘
                                 ↓
┌─────────────────────────────────────────────────────────────────────┐
│                       DATABASE TIER                                  │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │  MySQL 8.0                                                   │  │
│  │  - User & Authentication Data                               │  │
│  │  - Product Catalog                                          │  │
│  │  - Orders & Transactions                                    │  │
│  │  - Seller Listings                                          │  │
│  │  - Payment Records                                          │  │
│  │  Backup: Daily (Off-site)                                   │  │
│  └──────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
                                 ↓
┌─────────────────────────────────────────────────────────────────────┐
│                      STORAGE TIER                                    │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │  Cloudflare R2 (Object Storage)                              │  │
│  │  - Product Images                                           │  │
│  │  - User Avatars                                             │  │
│  │  - Document Storage                                         │  │
│  │  Region: Auto-replicated                                    │  │
│  └──────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
                                 ↓
┌─────────────────────────────────────────────────────────────────────┐
│                    EXTERNAL SERVICES                                 │
│  ┌──────────────────────┬──────────────────┬──────────────────┐    │
│  │  PayPal (Payment)    │  Email Service   │  SMS (Future)    │    │
│  │  - OAuth            │  - SMTP          │  - Twilio        │    │
│  │  - Payment Auth     │  - Transactional │  - OTP           │    │
│  └──────────────────────┴──────────────────┴──────────────────┘    │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 🔐 NETWORK SECURITY & ACCESS

```
┌─ INTERNET ─────────────────────────────────────────────────────┐
│                                                                 │
│  Public Access (HTTPS only):                                   │
│  ├─ Port 80 → Cloudflare (redirect to 443)                    │
│  └─ Port 443 → Cloudflare (WAF + SSL)                         │
│                                                                 │
└────────────────────────────────────────────────────────────────┘
                            ↓
┌─ CLOUDFLARE ───────────────────────────────────────────────────┐
│  - DDoS Protection                                              │
│  - Rate Limiting                                                │
│  - SSL/TLS Termination                                          │
│  - WAF (Web Application Firewall)                               │
└────────────────────────────────────────────────────────────────┘
                            ↓
┌─ IONOS VPS ────────────────────────────────────────────────────┐
│  Firewall Rules:                                                │
│  ├─ ALLOW: Port 80 (HTTP)                                      │
│  ├─ ALLOW: Port 443 (HTTPS)                                    │
│  ├─ ALLOW: Port 22 (SSH, Tailscale only)                       │
│  ├─ DENY: Database port (3306)                                 │
│  ├─ DENY: Redis port (6379)                                    │
│  ├─ DENY: RabbitMQ port (5672)                                 │
│  └─ DENY: All other ports                                      │
│                                                                 │
│  Private Network (Tailscale VPN):                              │
│  ├─ Database access (DBeaver)                                  │
│  ├─ Admin access (SSH)                                         │
│  ├─ Internal service ports                                     │
│  ├─ Backup management                                          │
│  └─ Monitoring tools                                           │
└────────────────────────────────────────────────────────────────┘
```

---

## 📡 API COMMUNICATION FLOW

```
Frontend Request:
  Client → HTTPS → Cloudflare → Nginx → Service Routing

Authentication:
  1. Client sends credentials
  2. Authorization Server validates
  3. Issues JWT token
  4. Client includes JWT in all requests
  5. Services validate JWT

Service-to-Service (Internal):
  Payment Service → Marketplace Service (private network)
  Order Service → Wallet Service (private network)
  All internal communication over private Docker network

External Integrations:
  Marketplace Service → PayPal (HTTPS, OAuth)
  Auth Service → Google OAuth (HTTPS)
  Auth Service → Apple OAuth (HTTPS)
  Admin Service → Cloudflare R2 (HTTPS, signed URLs)
```

---

## 📊 DATA FLOW ARCHITECTURE

```
User Action:
  User clicks "Buy" → CartScreen component
  
API Request:
  Frontend sends: POST /checkout with cart data + JWT token
  
Service Processing:
  1. Nginx routes to Payment Service
  2. Service validates JWT
  3. Calls Marketplace Service (get product prices)
  4. Calls Authorization Service (verify user)
  5. Prepares PayPal authorization
  
External Service:
  6. Calls PayPal API (HTTPS)
  7. PayPal returns authorization token
  
Response:
  8. Payment Service returns payment authorization to client
  9. Client shows PayPal payment UI
  
Confirmation:
  10. User completes PayPal payment
  11. Frontend sends payment confirmation + authorization token
  12. Payment Service captures payment with PayPal
  13. Creates Order in database
  14. Publishes "OrderCreated" event to RabbitMQ
  15. Order Service consumes event, updates fulfillment
  16. Notifies seller via notification system
  17. Returns order confirmation to client
  
Persistence:
  - Order saved in MySQL
  - Payment record in MySQL
  - Cache updated in Redis
  - Images stored in Cloudflare R2
```

---

## 🔄 MICROSERVICES INTERACTION MATRIX

```
┌────────────────────┬──────────┬──────────┬──────────┬──────────┬──────────┐
│ Service            │ Auth     │ Market   │ Payment  │ Order    │ Wallet   │
├────────────────────┼──────────┼──────────┼──────────┼──────────┼──────────┤
│ Auth Server        │ -        │ Issues   │ Issues   │ Issues   │ Issues   │
│ (User)             │          │ JWT      │ JWT      │ JWT      │ JWT      │
├────────────────────┼──────────┼──────────┼──────────┼──────────┼──────────┤
│ Marketplace        │ Validates│ -        │ Gets     │ Sends    │ Updates  │
│ Service            │ JWT      │          │ pricing  │ product  │ seller   │
│                    │          │          │          │ details  │ stats    │
├────────────────────┼──────────┼──────────┼──────────┼──────────┼──────────┤
│ Payment Service    │ Validates│ Gets     │ -        │ Creates  │ Records  │
│                    │ JWT      │ items    │          │ orders   │ payment  │
├────────────────────┼──────────┼──────────┼──────────┼──────────┼──────────┤
│ Order Service      │ Validates│ Updates  │ Queries  │ -        │ Updates  │
│ (Future)           │ JWT      │ inventory│ for      │          │ fulfill  │
│                    │          │          │ disputes │          │ amounts  │
├────────────────────┼──────────┼──────────┼──────────┼──────────┼──────────┤
│ Wallet Service     │ Validates│ Gets     │ Queries  │ Updates  │ -        │
│ (Future)           │ JWT      │ commissions
│                    │          │          │          │ refunds  │          │
└────────────────────┴──────────┴──────────┴──────────┴──────────┴──────────┘
```

---

## 🗄️ DATA PERSISTENCE ARCHITECTURE

```
Database Abstraction:
  ├─ User Service Layer → Flyway Migrations
  ├─ ORM: Spring Data JPA
  ├─ Query Layer: Repository Pattern
  └─ Transaction Management: Spring @Transactional

Caching Strategy:
  ├─ Level 1: In-Memory (Application Cache)
  ├─ Level 2: Redis (Distributed Cache)
  │  ├─ User Sessions (TTL: 24h)
  │  ├─ Product Listings (TTL: 1h)
  │  ├─ Cart Data (TTL: 7 days)
  │  ├─ Search Results (TTL: 30m)
  │  └─ Configuration (TTL: 24h)
  └─ Level 3: Database (Source of Truth)

Backup Strategy:
  ├─ Frequency: Daily at 2 AM UTC
  ├─ Retention: 30 days
  ├─ Location: Off-site (separate cloud)
  ├─ Encryption: AES-256
  └─ Recovery: Point-in-time available

Media Storage:
  ├─ Cloudflare R2 (Primary)
  ├─ Auto-replicated across regions
  ├─ CDN: Cloudflare Edge (global)
  ├─ Signed URLs (time-limited access)
  └─ Image optimization: On-the-fly (Cloudflare)
```

---

## 🔒 SECURITY ARCHITECTURE

```
Transport Security:
  ├─ TLS 1.3 (minimum)
  ├─ Perfect Forward Secrecy enabled
  ├─ Strong cipher suites only
  └─ HSTS headers (1 year)

Authentication:
  ├─ OAuth2/OIDC flows
  ├─ JWT tokens (HS256 / RS256)
  ├─ Secure refresh token rotation
  ├─ Token expiry: 1 hour (access), 30 days (refresh)
  └─ Secure storage (SecureStore on mobile)

Authorization:
  ├─ Role-based access control (RBAC)
  ├─ Resource-level permissions
  ├─ Backend enforcement (not frontend)
  └─ Audit logging of all sensitive actions

Data Protection:
  ├─ Encryption at rest (AES-256)
  ├─ Encryption in transit (TLS 1.3)
  ├─ PII hashing (passwords, sensitive data)
  ├─ Database-level encryption enabled
  └─ Secure credential management (see docs/security/CREDENTIALS.md)

API Security:
  ├─ Rate limiting per user/IP
  ├─ CORS properly configured
  ├─ CSRF protection (token validation)
  ├─ Input validation & sanitization
  ├─ SQL injection prevention (parameterized queries)
  ├─ XSS prevention (output encoding)
  └─ Request signing (if needed)
```

---

## 📈 SCALABILITY & PERFORMANCE

```
Horizontal Scaling:
  ├─ Multiple Nginx instances (behind load balancer)
  ├─ Multiple service instances (Docker replicas)
  ├─ Database read replicas (if needed)
  ├─ Redis cluster for distributed cache
  └─ CDN for static assets

Performance Optimization:
  ├─ Frontend:
  │  ├─ Code splitting (Expo Router)
  │  ├─ Lazy loading (images, lists)
  │  ├─ Component memoization
  │  └─ Bundle size monitoring (< 200KB)
  ├─ Backend:
  │  ├─ Database indexing (production)
  │  ├─ Query optimization
  │  ├─ Async processing (RabbitMQ)
  │  └─ Connection pooling
  └─ Infrastructure:
     ├─ CDN for images (Cloudflare R2)
     ├─ Database connection pooling
     ├─ Redis cache warming
     └─ Monitoring & alerting (Prometheus/Grafana)

Capacity Planning:
  ├─ Estimated peak load: 10,000 concurrent users
  ├─ Database size: Start ~5GB, scale as needed
  ├─ Storage: R2 auto-scales
  ├─ Network: Cloudflare auto-scales
  └─ Review quarterly and adjust
```

---

## 🚀 DEPLOYMENT ARCHITECTURE

```
Development:
  └─ Local Docker Compose
     └─ All services (MySQL, Redis, RabbitMQ, API servers)

Staging:
  └─ IONOS VPS (same as production)
     ├─ Docker Compose with reduced scale
     ├─ Test database
     ├─ Full integration testing
     └─ Load testing

Production:
  └─ IONOS VPS (Linux)
     ├─ Docker Compose (orchestration)
     ├─ Nginx (reverse proxy + load balancer)
     ├─ 6 Spring Boot microservices
     ├─ MySQL (managed backup)
     ├─ Redis (cluster)
     ├─ RabbitMQ (message broker)
     ├─ Cloudflare R2 (object storage)
     └─ Monitoring (ELK stack optional)

CI/CD Pipeline:
  ├─ GitHub Actions (automated builds)
  ├─ Build → Test → Push to registry
  ├─ Deploy to staging (auto)
  ├─ Manual approval for production
  ├─ Rolling updates (zero downtime)
  └─ Rollback capability (previous image)

Monitoring & Alerts:
  ├─ Application logs (Docker, ELK stack)
  ├─ Health checks (all services)
  ├─ Metrics (Prometheus optional)
  ├─ Alerts (Slack/Email)
  └─ Uptime monitoring (external)
```

---

## 📋 ARCHITECTURE DECISIONS

| Decision | Rationale | Trade-offs |
|----------|-----------|-----------|
| Microservices | Scalability, independent deployment | Complexity, network overhead |
| Spring Boot | Mature, enterprise-grade, great ecosystem | JVM startup time, memory usage |
| Docker Compose | Easy local dev, production-ready, simple ops | Less powerful than K8s (not needed yet) |
| Cloudflare R2 | S3-compatible, cheap, global CDN | Vendor lock-in (mitigation: standard S3 API) |
| MMKV for mobile | Fast, encrypted local storage | Android/iOS specific (best for mobile) |
| PayPal only (MVP) | Simpler integration, single provider | Limited payment options (add later) |
| JWT over sessions | Stateless, scalable, mobile-friendly | Token revocation complexity (mitigated with refresh) |

---

## 🔄 Architecture Evolution Path

```
MVP (Current):
  └─ 6 services, single VPS, basic monitoring

Phase 2 (3-6 months):
  ├─ Horizontal scaling (multiple VPS or K8s)
  ├─ Database read replicas
  ├─ Advanced monitoring (Prometheus/Grafana)
  └─ Load testing

Phase 3 (6-12 months):
  ├─ Kubernetes orchestration
  ├─ Multi-region deployment
  ├─ Advanced caching (CDN edge functions)
  └─ Analytics pipeline

Phase 4 (12+ months):
  ├─ Event sourcing for critical flows
  ├─ GraphQL API layer (if needed)
  ├─ Advanced security (WAF ML, bot detection)
  └─ Multi-tenant architecture
```

---

**Architecture Status:** ✅ Production-Ready for MVP  
**Last Review:** June 7, 2026  
**Next Review:** When considering Phase 2 scaling
