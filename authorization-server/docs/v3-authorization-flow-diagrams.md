# V3 Authorization Flow Diagrams

These diagrams describe the V3.1 implementation currently completed in `authorization-server`.

Scope covered:

- Existing login and JWT creation
- User module dashboard authorization
- Verified user `CUSTOMER` role assignment
- Provider account enrollment and admin approval
- Internal provider eligibility checks
- User restrictions

Pending outside this document:

- Spring Authorization Server OAuth2/OIDC migration
- Marketplace service
- Payment service
- Wallet service
- Flutter application
- Platform web BFF

## Authorization Server Flow

```mermaid
flowchart TD
    U[User / Admin / Internal Service] --> N[Nginx / API Route]
    N --> A[authorization-server]

    A --> AUTH[Existing Auth APIs]
    AUTH --> REG[Register]
    AUTH --> VERIFY[Email Verify]
    AUTH --> LOGIN[Login]
    AUTH --> JWT[JWT Access Token]

    VERIFY --> ROLE1[Assign USER]
    VERIFY --> ROLE2[Assign CUSTOMER]

    A --> USERAPI[User Platform APIs]
    USERAPI --> MODULES[Get My Modules]
    USERAPI --> CAPS[Get My Capabilities]
    USERAPI --> PA[Provider Accounts]
    PA --> ENROLL[Enroll Provider Module]

    A --> ADMINAPI[Admin APIs]
    ADMINAPI --> SM[Service Module Catalog]
    ADMINAPI --> COUNTRY[Supported Countries]
    ADMINAPI --> APPROVAL[Provider Approval]
    ADMINAPI --> RESTRICT[User Restrictions]

    A --> INTERNAL[Internal APIs]
    INTERNAL --> ELIG[Provider Module Eligibility]
    INTERNAL --> ACTIVE_REST[Active User Restrictions]

    A --> DB[(Current MySQL auth DB)]

    DB --> T1[Existing user/auth tables]
    DB --> T2[service_module]
    DB --> T3[supported_country]
    DB --> T4[service_module_country]
    DB --> T5[provider_account]
    DB --> T6[provider_module_enrollment]
    DB --> T7[user_module_access]
    DB --> T8[user_restriction]
```

## User Login And Module Access

```mermaid
sequenceDiagram
    actor User
    participant UI as Client UI
    participant Auth as authorization-server
    participant DB as auth DB

    User->>UI: Login with email/password
    UI->>Auth: POST /v1/auth/login
    Auth->>DB: Validate user credentials
    DB-->>Auth: User, roles, app access
    Auth-->>UI: JWT access token

    UI->>Auth: GET /v1/users/me/modules
    Note over UI,Auth: Authorization: Bearer JWT
    Auth->>DB: Load service_module catalog
    Auth->>DB: Load user roles
    Auth->>DB: Load active provider module access
    DB-->>Auth: Module catalog and access data
    Auth-->>UI: Dynamic module dashboard response

    UI->>Auth: GET /v1/users/me/capabilities
    Note over UI,Auth: Authorization: Bearer JWT
    Auth->>DB: Load CUSTOMER role and provider module access
    Auth-->>UI: Customer/provider capability response
```

## Email Verification Role Assignment

```mermaid
sequenceDiagram
    actor User
    participant Auth as authorization-server
    participant DB as auth DB

    User->>Auth: POST /v1/auth/register
    Auth->>DB: Create app_user as PENDING_VERIFICATION
    Auth->>DB: Create user_credential and user_profile
    Auth->>DB: Assign USER role
    Auth->>DB: Create email_verification_token
    Auth-->>User: Verification email/token

    User->>Auth: POST /v1/auth/verify-email
    Auth->>DB: Validate email_verification_token
    Auth->>DB: Set email_verified=true
    Auth->>DB: Set status=ACTIVE
    Auth->>DB: Assign CUSTOMER role
    Auth-->>User: Email verified
```

## Provider Enrollment And Admin Approval

```mermaid
sequenceDiagram
    actor ProviderUser
    actor Admin
    participant Auth as authorization-server
    participant DB as auth DB

    ProviderUser->>Auth: POST /v1/users/me/provider-accounts
    Note over ProviderUser,Auth: Authorization: Bearer JWT
    Auth->>DB: Validate supported country onboarding
    Auth->>DB: Create provider_account status=PENDING
    Auth-->>ProviderUser: Provider account created

    ProviderUser->>Auth: POST /v1/users/me/provider-accounts/{providerPublicId}/modules/MARKETPLACE/enroll
    Auth->>DB: Validate service_module MARKETPLACE provider access
    Auth->>DB: Validate service_module_country onboarding
    Auth->>DB: Create provider_module_enrollment APPLICATION_SUBMITTED
    Auth-->>ProviderUser: Enrollment submitted

    Admin->>Auth: GET /v1/admin/providers/pending
    Note over Admin,Auth: Admin JWT required
    Auth->>DB: Load pending providers and submitted enrollments
    Auth-->>Admin: Pending provider list

    Admin->>Auth: PUT /v1/admin/providers/{providerPublicId}/modules/MARKETPLACE/status
    Auth->>DB: Set enrollment status=APPROVED
    Auth->>DB: Set provider overall_status=ACTIVE
    Auth->>DB: Set provider verification_status=APPROVED
    Auth->>DB: Create user_module_access PROVIDER_OWNER
    Auth-->>Admin: Provider module approved
```

## Internal Provider Eligibility Check

```mermaid
sequenceDiagram
    participant Service as Marketplace/Payment Service
    participant Auth as authorization-server
    participant DB as auth DB

    Service->>Auth: GET /internal/api/v1/providers/{providerPublicId}/modules/{moduleCode}/eligibility
    Note over Service,Auth: X-Internal-Service-Token required

    Auth->>Auth: Validate internal service token
    Auth->>DB: Load provider_account
    Auth->>DB: Load provider_module_enrollment
    Auth->>DB: Check active user_restriction
    DB-->>Auth: Provider, enrollment, restriction state

    Auth-->>Service: eligible=true/false with high-level state
```

Eligibility returns `true` only when:

- Provider account is `ACTIVE`
- Module enrollment is `APPROVED`
- Selling is enabled
- No active provider/module/account blocking restriction exists

## User Restriction Flow

```mermaid
sequenceDiagram
    actor Admin
    participant Auth as authorization-server
    participant DB as auth DB
    participant Service as Marketplace/Payment Service

    Admin->>Auth: POST /v1/admin/users/{publicId}/restrictions
    Note over Admin,Auth: Admin JWT required
    Auth->>DB: Create user_restriction
    Auth-->>Admin: Restriction created

    Service->>Auth: GET /internal/api/v1/users/{userPublicId}/restrictions/active
    Note over Service,Auth: X-Internal-Service-Token required
    Auth->>Auth: Validate internal service token
    Auth->>DB: Load active non-expired restrictions
    Auth-->>Service: Active restrictions list

    Service->>Auth: GET /internal/api/v1/providers/{providerPublicId}/modules/{moduleCode}/eligibility
    Auth->>DB: Check provider, enrollment, and restrictions
    Auth-->>Service: eligible=false when blocked
```

## V3.1 Data Ownership

```mermaid
flowchart LR
    AS[authorization-server] --> AUTHDB[(auth DB)]

    AUTHDB --> USERS[app_user / user_credential / user_profile]
    AUTHDB --> ROLES[app_role / user_role]
    AUTHDB --> MODULES[service_module]
    AUTHDB --> COUNTRIES[supported_country / service_module_country]
    AUTHDB --> PROVIDERS[provider_account / provider_module_enrollment]
    AUTHDB --> ACCESS[user_module_access]
    AUTHDB --> RESTRICTIONS[user_restriction]

    MS[marketplace-service - pending] -. internal eligibility .-> AS
    PS[payment-service - pending] -. internal eligibility/restrictions .-> AS
    WS[wallet-service - pending] -. JWT validation later .-> AS
```

