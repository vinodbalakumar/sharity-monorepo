# Sharity storefront and session navigation ? October 26, 2026

The Expo storefront uses a shared blue-and-white palette, system fonts, React Native Paper controls and a responsive shell. Existing libraries were reused. The landing page and signed-in home share product discovery; the all-products page removes the marketing hero. Header search, categories, sorting, product cards and readable prices have consistent behavior.

## Session boundary

The BFF remains the authentication authority. `login=success` is a return marker only. Bootstrap checks the session before mounting account routes. Guests reaching Home, Orders, Cart, Checkout or other private screens receive the public landing page and an explicit sign-in option; public catalog and product pages remain browsable.

Explicit sign-in stores a route snapshot in browser session storage for at most 15 minutes. Only routes recognized by the app's path parser can be restored, and restoration requires an authenticated BFF session. Authentication tokens are excluded. No external return URL is accepted. Focus/pageshow refresh session knowledge without automatically navigating welcome/register to Home. Browser history guards private snapshots for guests; product IDs have actual deep-link paths and survive refresh.

This UI routing is usability protection, not API authorization. Existing BFF sessions, CSRF and backend role checks remain required. Android/iOS exports do not prove an installed native OAuth flow; native sign-in must not mark a guest authenticated.

## Catalog and imagery

Listing data comes from marketplace APIs. The storefront normally requests the listings endpoint once, with home featured listings as a fallback. Empty results, loading, failures and retry are explicit states. Demo seed records are labelled and use category illustrations because their shared seed photograph does not describe the products. Real images retain an error fallback. No inventory, price or payment state is fabricated.

Product detail and related listings load concurrently. A related-list request failure does not discard a valid requested product. Guests do not fetch `/users/me`; account-dependent actions request sign-in. Related-product controls open the actual selected listing.

## Verification and deployment

See [the release record](../production/STOREFRONT_REFRESH.md) for completed checks, public browser evidence, image rollback tag and current limits. Browser contract tests live in `sharity-app-ui/tests/e2e`; actual public checks are separate. Deployment updates only the Expo web container in the existing local Docker stack and reloads edge Nginx. Tesla remains disabled. No DNS, schema or payment configuration changes are part of this UI release.
