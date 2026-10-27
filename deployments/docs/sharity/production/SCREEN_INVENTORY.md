# Routed screen inventory

The recovery matrix covers 46 routes at 320 and 1440 pixels in Chromium. Public browsing, checkout, chat and responsive regression contracts also run in Firefox and WebKit. These are explicit scenarios, not certification of all business integrations.

| Route | Scenario |
| --- | --- |
| `/app/` | Verified session; downstream service unavailable; no crash or control overflow |
| `/app/home` | Verified session; downstream service unavailable; no crash or control overflow |
| `/app/marketplaces` | Verified session; downstream service unavailable; no crash or control overflow |
| `/app/marketplace/digital` | Verified session; downstream service unavailable; no crash or control overflow |
| `/app/marketplace/jewellery` | Verified session; downstream service unavailable; no crash or control overflow |
| `/app/electronics` | Verified session; downstream service unavailable; no crash or control overflow |
| `/app/products/audit-product` | Verified session; downstream service unavailable; no crash or control overflow |
| `/app/electronics/audit-product` | Verified session; downstream service unavailable; no crash or control overflow |
| `/app/cart` | Verified session; downstream service unavailable; no crash or control overflow |
| `/app/checkout` | Verified session; downstream service unavailable; no crash or control overflow |
| `/app/library` | Verified session; downstream service unavailable; no crash or control overflow |
| `/app/orders` | Verified session; downstream service unavailable; no crash or control overflow |
| `/app/orders/details?orderId=missing` | Verified session; downstream service unavailable; no crash or control overflow |
| `/app/orders/receipt?orderId=missing` | Verified session; downstream service unavailable; no crash or control overflow |
| `/app/orders/tracking?orderId=missing` | Verified session; downstream service unavailable; no crash or control overflow |
| `/app/orders/refund-request?orderId=missing` | Verified session; downstream service unavailable; no crash or control overflow |
| `/app/orders/refund-status?orderId=missing` | Verified session; downstream service unavailable; no crash or control overflow |
| `/app/orders/dispute?orderId=missing` | Verified session; downstream service unavailable; no crash or control overflow |
| `/app/orders/dispute-status?orderId=missing` | Verified session; downstream service unavailable; no crash or control overflow |
| `/app/notifications` | Verified session; downstream service unavailable; no crash or control overflow |
| `/app/admin/diagnostics` | Verified session; downstream service unavailable; no crash or control overflow |
| `/app/app-settings` | Verified session; downstream service unavailable; no crash or control overflow |
| `/app/login-security` | Verified session; downstream service unavailable; no crash or control overflow |
| `/app/profile` | Verified session; downstream service unavailable; no crash or control overflow |
| `/app/account-switcher` | Verified session; downstream service unavailable; no crash or control overflow |
| `/app/payment-authorization` | Verified session; downstream service unavailable; no crash or control overflow |
| `/app/pricing-promotions` | Verified session; downstream service unavailable; no crash or control overflow |
| `/app/rewards` | Verified session; downstream service unavailable; no crash or control overflow |
| `/app/wallet` | Verified session; downstream service unavailable; no crash or control overflow |
| `/app/marketplace-config` | Verified session; downstream service unavailable; no crash or control overflow |
| `/app/sell` | Verified session; downstream service unavailable; no crash or control overflow |
| `/app/seller` | Verified session; downstream service unavailable; no crash or control overflow |
| `/app/policies` | Verified session; downstream service unavailable; no crash or control overflow |
| `/app/support` | Verified session; downstream service unavailable; no crash or control overflow |
| `/app/register` | Verified session; downstream service unavailable; no crash or control overflow |
| `/app/forgot-password` | Verified session; downstream service unavailable; no crash or control overflow |
| `/app/library/reveal?accessId=missing` | Verified session; downstream service unavailable; no crash or control overflow |
| `/app/library/download?accessId=missing` | Verified session; downstream service unavailable; no crash or control overflow |
| `/app/payment/status` | Verified session; downstream service unavailable; no crash or control overflow |
| `/app/payment/failed` | Verified session; downstream service unavailable; no crash or control overflow |
| `/app/payment/cancelled` | Verified session; downstream service unavailable; no crash or control overflow |
| `/app/reset-password` | Verified session; downstream service unavailable; no crash or control overflow |
| `/app/verify-email` | Verified session; downstream service unavailable; no crash or control overflow |
| `/app/complete-registration` | Verified session; downstream service unavailable; no crash or control overflow |
| `/app/legal/privacy` | Verified session; downstream service unavailable; no crash or control overflow |
| `/chat` | Verified session; downstream service unavailable; no crash or control overflow |

Startup splash and external sign-in are covered by session-restoration and guest-navigation tests. Admin portal: Dashboard, Services, Commerce, Users, Create User, Roles, User Details, Applications, Audit Logs, Reports, Profile, Sessions and Settings each have desktop/mobile failure audits. Admin login is checked separately after deployment.

See [functional flows and feature boundaries](../architecture/SHARITY_FUNCTIONAL_FLOWS.md).
