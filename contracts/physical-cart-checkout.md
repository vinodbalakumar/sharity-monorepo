# Consolidated physical cart checkout

Implemented by Marketplace V58 and Payment V25 in both database dialects.
Controller DTOs remain the authoritative JSON definitions. These APIs persist
checkout/payment state; they are not the older stateless `/api/cart` previews.
Existing purchase/gateway gates still prohibit real-money operation.

## Buyer API

All paths below are relative to marketplace-service and require an authenticated
buyer. The browser uses its existing BFF/session API proxy.

`POST /api/v1/marketplace/cart/{cartPublicId}/checkout`

Header: `Idempotency-Key` (16-64 ASCII letters, digits, `_` or `-`).
The key is scoped to the buyer. Store the key and immutable request before sending.

```json
{
  "items": [
    {"cartItemId": "cart-line-a", "quantity": 2, "unitPrice": 10.00, "currencyCode": "USD"},
    {"cartItemId": "cart-line-b", "quantity": 1, "unitPrice": 30.00, "currencyCode": "USD"}
  ]
}
```

The snapshot must include every current cart line exactly once (maximum 50
lines, quantities 1-99). The server checks ownership, physical delivery,
availability, inventory, current unit price and a single currency. It rejects
digital lines; instant-delivery digital Buy Now remains single-item. The
checkout cannot silently drop lines or substitute prices. Updated catalog
prices reprice the cart and return 409 for buyer review.

Success: 201 with this shape (orders use the existing `OrderResponse`):

```json
{
  "checkoutPublicId": "checkout-uuid",
  "status": "PAYMENT_PENDING",
  "currencyCode": "USD",
  "itemAmount": 50.00,
  "platformFeeAmount": 2.50,
  "customerTotalAmount": 50.00,
  "providerAmount": 47.50,
  "orders": [
    {
      "publicId": "child-order-uuid",
      "listingPublicId": "listing-uuid",
      "orderStatus": "PAYMENT_PENDING",
      "paymentStatus": "PENDING",
      "fulfillmentStatus": "PENDING_DELIVERY",
      "payoutStatus": "PAYMENT_PENDING",
      "customerTotalAmount": 20.00,
      "currencyCode": "USD",
      "createdAt": "2026-10-28T20:00:00",
      "quantity": 2
    }
  ]
}
```

The example shows one child shape; the actual response includes every child.
One child is persisted per listing line, including its quantity and unit price.
Replaying the same key and semantic snapshot returns the original checkout,
even with an emptied cart. A changed snapshot with the same key returns 409.
An ambiguous network error must retry the saved request, not generate a new key.

`GET /api/v1/marketplace/cart/{cartPublicId}/checkout-attempt`, with the same
`Idempotency-Key` header, resolves an explicit rejected submission. It locks
the owned cart before querying the buyer's key so an in-flight submission must
settle first. The non-cacheable 200 response is `{"checkout": null}` if none
was created, or `{"checkout": <CheckoutResponse>}` to recover a committed
checkout. Foreign carts return 404 and keys belonging to a different cart
return 409. This lookup creates nothing and does not refresh the payment.
Only a definitive null response allows the UI to return to cart review and
replace a changed snapshot/key. A timeout or failed lookup preserves the
original intent for retry.

`GET /api/v1/marketplace/checkouts/{checkoutPublicId}` returns the same shape,
validating and refreshing the payment projection. Only the owner can read it.
`PAYMENT_PENDING` is not payment confirmation. Confirmed capture becomes `PAID`;
a dispute becomes `DISPUTE_HOLD`. Explicit terminal payment failure becomes
`PAYMENT_FAILED`. Dependency/validation errors must not be shown as success.

Errors: 400 invalid snapshot/key or digital lines; 401 unauthenticated;
404 absent/foreign cart or checkout; 409 changed cart/prices/stock/currency or
idempotency conflict; 503 purchases disabled; 502 failed payment-state refresh.
Existing generic error formatting can omit detailed server reasons.

## Internal payment API

Relative prefix: `/internal/api/v1`. Requests require the existing
`X-Internal-Service-Token`, not buyer-provided seller identities.

`POST /payments/checkouts`

```json
{
  "checkoutPublicId": "checkout-uuid",
  "customerUserPublicId": "buyer-uuid",
  "currencyCode": "USD",
  "amount": 50.00,
  "platformFeeAmount": 2.50,
  "providerPayableAmount": 47.50,
  "allocations": [
    {
      "marketplaceOrderPublicId": "order-a",
      "providerAccountPublicId": "seller-a",
      "providerCountryCode": "US",
      "amount": 20.00,
      "platformFeeAmount": 1.00,
      "providerPayableAmount": 19.00
    },
    {
      "marketplaceOrderPublicId": "order-b",
      "providerAccountPublicId": "seller-b",
      "providerCountryCode": "US",
      "amount": 30.00,
      "platformFeeAmount": 1.50,
      "providerPayableAmount": 28.50
    }
  ]
}
```

For each allocation, `fee = round(amount * 0.05, 2, HALF_UP)` and
`amount = fee + providerPayableAmount`. Parent fields equal the exact sums.
The buyer pays item amounts; no additional buyer fee is introduced. Seller
countries must resolve to one compatible enabled gateway; incompatible
gateway routing fails explicitly instead of splitting the charge.

Payment durably reserves the capture intent, uses a stable gateway key and
records one capture. Exact replay returns its recorded response; changed
payloads/duplicate child identities conflict. No per-seller payout is created.

`GET /payments/checkouts/{id}` returns `CheckoutPaymentResponse`: checkout/payment
IDs, buyer/currency/totals, `checkoutStatus`, `paymentStatus`,
`aggregateAllocationStatus`, `payoutMode=LEDGER_ONLY`, timestamps and allocation
records. Each allocation includes its child/seller identity, currency/amounts,
`allocationStatus`, hold/dispute reasons and eligibility/dispute timestamps.

`POST /payments/checkouts/{id}/allocations/{orderId}/mark-payout-eligible`
has no body. It idempotently moves a captured held allocation to
`ELIGIBLE_LEDGER_ONLY`, never calls `releasePayout`, and rejects disputed lines.

`POST /payments/checkouts/{id}/allocations/{orderId}/dispute-request`
accepts `{"reason":"Damaged on arrival"}` (maximum 255 characters) and records
`DISPUTE_HOLD`. Funds stay accounted for and are not refunded or transferred.

Consolidated refund and cancel endpoints, including allocation variants and
legacy operations targeting either parent or child IDs, return 409 before
mutation. Safe partial reversals and live seller payouts are not implemented.
Legacy independent single-listing payment/payout lifecycles are unchanged.
