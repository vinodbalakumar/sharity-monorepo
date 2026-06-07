# Credentials & Secrets Management - Sharity MVP

**Version:** 1.0  
**Last Updated:** June 7, 2026  
**Status:** CONFIDENTIAL - Developers & Ops Only  
**Classification:** Internal Use Only

⚠️ **DO NOT COMMIT CREDENTIALS TO GIT**

---

## 🔐 SECRETS MANAGEMENT STRATEGY

### Principle
```
✅ ALL secrets in secure vault (never in code)
✅ Environment-based configuration
✅ Regular rotation schedule
✅ Access control via roles
✅ Audit logging for sensitive operations
❌ No secrets in .env files (use vault)
❌ No secrets in code comments
❌ No secrets in logs
```

---

## 📦 DEVELOPMENT ENVIRONMENT SETUP

### 1. Create `.env.local` (NOT tracked in git)

```bash
# .env.local (Development only, NEVER commit this)

# Authentication
AUTH_JWT_SECRET=your-random-jwt-secret-32-chars-min
AUTH_JWT_EXPIRY=3600
AUTH_REFRESH_TOKEN_SECRET=your-random-refresh-secret
AUTH_REFRESH_TOKEN_EXPIRY=2592000

# Database (Local)
DB_HOST=localhost
DB_PORT=3306
DB_NAME=sharity_dev
DB_USER=sharity_user
DB_PASSWORD=REDACTED_LEGACY_CREDENTIAL
DB_POOL_SIZE=10

# Redis (Local)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0

# RabbitMQ (Local)
RABBITMQ_HOST=localhost
RABBITMQ_PORT=5672
RABBITMQ_USER=guest
RABBITMQ_PASSWORD=guest

# Google OAuth (Development)
GOOGLE_CLIENT_ID=your-google-dev-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-dev-client-secret
GOOGLE_REDIRECT_URI=http://localhost:3000/auth/google/callback

# Apple OAuth (Development)
APPLE_KEY_ID=your-apple-key-id
APPLE_TEAM_ID=your-apple-team-id
APPLE_BUNDLE_ID=com.sharity.app.dev
APPLE_KEY_CONTENT=-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----

# PayPal (Sandbox)
PAYPAL_CLIENT_ID=your-paypal-sandbox-client-id
PAYPAL_CLIENT_SECRET=your-paypal-sandbox-secret
PAYPAL_MODE=sandbox

# Email Service (SendGrid or SMTP)
SENDGRID_API_KEY=SG.your-sendgrid-key
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASSWORD=SG.your-sendgrid-key

# Cloudflare R2
R2_ACCOUNT_ID=your-r2-account-id
R2_ACCESS_KEY_ID=your-r2-access-key
R2_SECRET_ACCESS_KEY=your-r2-secret-key
R2_BUCKET_NAME=sharity-dev
R2_REGION=auto

# Logging
LOG_LEVEL=debug
```

### 2. Add to `.gitignore`

```gitignore
# Environment files
.env
.env.local
.env.*.local
.env.production

# Secrets
credentials.json
secrets.json
*.pem
*.p12
*.key
*.crt

# IDE
.idea/
.vscode/settings.json

# Dependencies
node_modules/
.gradle/
target/

# Build
dist/
build/
out/

# OS
.DS_Store
Thumbs.db
```

---

## 🔒 STAGING ENVIRONMENT CREDENTIALS

### Vault Storage (HashiCorp Vault or similar)

```
Path: secret/staging/

Keys:
├── database/
│   ├── host: staging-mysql.internal
│   ├── user: sharity_staging
│   ├── password: <strong-random-password>
│   └── database: sharity_staging
│
├── auth/
│   ├── jwt_secret: <strong-random-64-char>
│   ├── refresh_secret: <strong-random-64-char>
│   └── jwt_expiry: 3600
│
├── oauth/
│   ├── google_client_id: <staging-google-id>
│   ├── google_client_secret: <staging-secret>
│   ├── apple_key_id: <staging-apple-key>
│   └── apple_team_id: <staging-apple-team>
│
├── payment/
│   ├── paypal_client_id: <sandbox-client-id>
│   ├── paypal_client_secret: <sandbox-secret>
│   └── paypal_mode: sandbox
│
├── storage/
│   ├── r2_account_id: <staging-r2-account>
│   ├── r2_access_key: <staging-r2-key>
│   └── r2_secret_key: <staging-r2-secret>
│
└── email/
    ├── sendgrid_key: <staging-sendgrid-key>
    └── smtp_password: <staging-smtp-password>
```

### Access Control
```
Staging Vault Access:
├─ Engineers: Read-only for troubleshooting
├─ DevOps: Full access for updates
├─ QA: Read-only for environment verification
└─ External: DENIED
```

---

## 🏢 PRODUCTION ENVIRONMENT CREDENTIALS

### Vault Storage (Secured)

```
Path: secret/production/ (RESTRICTED ACCESS)

Keys: (Same structure as staging, with production values)
├── database/
│   ├── host: prod-mysql-primary.internal
│   ├── user: sharity_prod
│   ├── password: <64-character-strong-random>
│   └── database: sharity_prod
│
├── auth/
│   ├── jwt_secret: <production-jwt-secret>
│   ├── refresh_secret: <production-refresh-secret>
│   └── jwt_expiry: 3600
│
├── oauth/
│   ├── google_client_id: <production-google-id>
│   ├── google_client_secret: <production-secret>
│   ├── apple_key_id: <production-apple-key>
│   └── apple_team_id: <production-apple-team>
│
├── payment/
│   ├── paypal_client_id: <production-live-id>
│   ├── paypal_client_secret: <production-live-secret>
│   └── paypal_mode: live
│
├── storage/
│   ├── r2_account_id: <production-r2-account>
│   ├── r2_access_key: <production-r2-key>
│   └── r2_secret_key: <production-r2-secret>
│
├── email/
│   ├── sendgrid_key: <production-sendgrid-key>
│   └── smtp_password: <production-smtp-password>
│
├── ssl/
│   ├── certificate_pem: <production-cert>
│   ├── private_key_pem: <production-key>
│   └── ca_bundle_pem: <production-ca>
│
└── monitoring/
    ├── datadog_api_key: <datadog-key>
    ├── slack_webhook: <slack-webhook-url>
    └── pagerduty_key: <pagerduty-api-key>
```

### Access Control (Strict)
```
Production Vault Access:
├─ Engineers: DENIED (except for read-only troubleshooting)
├─ DevOps Lead: Full access (with MFA)
├─ Infrastructure: Full access (with MFA)
├─ QA: DENIED
├─ Management: DENIED
└─ External: DENIED
```

---

## 🔄 CREDENTIAL ROTATION SCHEDULE

### Monthly Rotation
```
Passwords:
├─ Database: 1st of month
├─ Redis: 1st of month
├─ SMTP: 2nd of month
└─ Application users: 7th of month
```

### Quarterly Rotation
```
API Keys:
├─ PayPal client secret: Q1, Q2, Q3, Q4
├─ Google OAuth secret: Q1, Q2, Q3, Q4
├─ Cloudflare R2 keys: Q1, Q2, Q3, Q4
└─ SendGrid API key: Q1, Q2, Q3, Q4
```

### Annually Rotation
```
Core Secrets:
├─ JWT secret: January 1
├─ Refresh token secret: January 1
└─ SSL certificates: Auto-renewed (before expiry)
```

### Rotation Procedure
```
1. Generate new credential in target system
2. Add to vault with new name (e.g., db_password_v2)
3. Update staging first, test thoroughly
4. Schedule production update (maintenance window)
5. Update production credentials
6. Verify all services working
7. Remove old credential after 30-day grace period
8. Document in changelog
```

---

## 🚨 LEAKED CREDENTIAL RESPONSE

### Immediate Actions (First 5 minutes)
```
1. REVOKE the compromised credential immediately
2. Alert security team
3. Check logs for unauthorized access
4. Document: when found, who found it, what systems affected
5. Do NOT delete (keep for forensics)
```

### Short Term (First hour)
```
1. Generate new credentials
2. Deploy to all affected systems
3. Verify services are working
4. Monitor logs for anomalies
5. Update team communication
```

### Investigation (First 24 hours)
```
1. Review logs for unauthorized access
2. Check for data exfiltration
3. Assess impact (data, systems, users)
4. File incident report
5. Notify legal/compliance if PII accessed
6. Prepare customer communication if needed
```

### Documentation
```
1. Create incident postmortem
2. Root cause analysis
3. Prevention measures
4. Timeline of response
5. Share learnings with team
```

---

## ✅ CREDENTIAL SECURITY CHECKLIST

### Development
- [ ] No credentials in code
- [ ] .env.local in .gitignore
- [ ] .env.local not shared publicly
- [ ] Local credentials different from staging/prod
- [ ] Use minimal permissions for dev credentials

### Staging
- [ ] Credentials in vault (not files)
- [ ] Access controlled by role
- [ ] Audit logging enabled
- [ ] Different from production
- [ ] Monitored for unauthorized access

### Production
- [ ] Credentials in secure vault only
- [ ] Multi-factor authentication for vault access
- [ ] Audit logging enabled for all access
- [ ] No developer access (only DevOps leads)
- [ ] Credentials rotated on schedule
- [ ] Breach response plan tested

### Incident Response
- [ ] Team trained on response
- [ ] Communication plan prepared
- [ ] Runbook documented
- [ ] Automation for credential rotation
- [ ] Monitoring alerts configured

---

## 📞 EMERGENCY ACCESS PROCEDURE

### Break-Glass Access (Emergency Only)

```
Condition: Production is down, vault unavailable, credentials needed

Procedure:
1. At least 2 authorized people must be present
2. Document: why, who, when, what was accessed
3. Request credentials from encrypted backup (offline storage)
4. Use credentials to restore service
5. File immediate incident report
6. Rotate all credentials within 24 hours
7. Review for any misuse
8. Update security procedures if needed
```

### Authorized Personnel
```
Break-glass access limited to:
├─ CTO / Tech Lead (always)
├─ DevOps Lead (always)
├─ Infrastructure Engineer (if above unavailable)
└─ CEO (executive override, only if both above unavailable)
```

---

## 🔐 CREDENTIAL STORAGE LOCATIONS

```
Development:
  └─ .env.local (NOT in git, local machine only)

Staging:
  └─ HashiCorp Vault (or AWS Secrets Manager)
     └─ Role-based access, audit logged

Production:
  └─ Secure vault with MFA
     └─ Restricted to DevOps lead only
     └─ All access logged
     └─ Automated rotation

Backup (Emergency):
  └─ Encrypted USB drive in physical safe
     └─ Updated quarterly
     └─ Audit logged when accessed
```

---

## 📋 THIRD-PARTY SERVICE CREDENTIALS

### PayPal
```
Staging (Sandbox):
  Client ID: (from vault)
  Client Secret: (from vault)
  Mode: sandbox
  Rotate: Q1, Q2, Q3, Q4

Production (Live):
  Client ID: (from vault)
  Client Secret: (from vault)
  Mode: live
  Rotate: Q1, Q2, Q3, Q4
  MFA Required: Yes
```

### Google OAuth
```
Development:
  Create in Google Cloud Console
  Restrict to localhost:3000
  Rotate: As needed

Production:
  Create in Google Cloud Console
  Restrict to domain only
  Rotate: Q1, Q2, Q3, Q4
```

### Cloudflare R2
```
Access Keys: Rotate Q1, Q2, Q3, Q4
API Token: Rotate annually
Bucket Policy: Least privilege
Cache Settings: Configured
```

---

## 📞 CONTACTS

**For Credential Issues:**
- DevOps Lead: [Contact info removed for security]
- CTO: [Contact info removed for security]

**For Security Incidents:**
- Security Team: [Contact info removed for security]
- Incident Response: [Contact info removed for security]

---

⚠️ **REMEMBER:**
- Never share credentials via email or chat
- Never paste credentials in logs
- Never hardcode credentials
- Always use the principle of least privilege
- Always audit access to secrets
- Always rotate regularly

---

**Credential Status:** ✅ Vault Integration Ready  
**Last Review:** June 7, 2026  
**Next Review:** September 7, 2026
