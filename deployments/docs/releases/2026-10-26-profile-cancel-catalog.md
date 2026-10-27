# Profile cancellation and catalog copy - 2026-10-26

The profile action bar now always shows Cancel beside Save changes, including before any edits. Cancel discards the local draft and returns to Home without sending a profile update. Both actions are disabled while a save or photo upload is in progress. Save remains disabled until fields change. The idle status sentence is removed; unsaved edits retain a concise status.

The catalog heading is All products. The redundant subtitle, large demo-catalog banner and Demo card badges are removed. Product details identify seeded inventory as Sample item; checkout availability and payment safeguards remain enforced. Failed images show Image unavailable.

Validation: TypeScript and incremental Expo web export; 16 focused Playwright scenarios across Chromium and WebKit, including profile widths 320, 390, 768 and 1440 pixels, save/privacy persistence, clean and dirty cancellation without extra writes, product images, missing-image navigation and out-of-stock purchase controls. See ignored outputs/profile-cancel-catalog.json. Deploy the exact tested export using scripts/sharity/deploy-verified-storefront.ps1 with MinimumPassingScenarios 16. This focused UI release does not change backend services or payment configuration.

Deployment: local sharity-local storefront replaced successfully; healthy container and origin HTML match the tested bundle. UI commit: d2d5b05. Lint: zero errors and 52 existing warnings.
