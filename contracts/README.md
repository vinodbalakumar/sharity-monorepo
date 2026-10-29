# API contracts

Keep service API specifications and shared compatibility fixtures here as they are extracted from the existing services. Changes to this directory trigger verification of every core component.

This directory does not introduce shared persistence entities or service implementation dependencies. Each service remains responsible for its database and public API. Existing controller DTOs and service OpenAPI endpoints remain the current definitions; no replacement specifications are fabricated by the migration.

- [Consolidated physical cart checkout](physical-cart-checkout.md): authenticated
  buyer API, internal payment contract, reconciliation and unsupported operations.
