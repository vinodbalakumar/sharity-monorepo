# Chat source badges removed

Source-reference badges and source update dates are no longer rendered below AI replies, including reopened conversations. The backend knowledge and source metadata are unchanged. Message info, response timing and token totals remain available.

Verification: TypeScript passed; focused ESLint passed; Expo web export passed; nine Chromium/Firefox/WebKit chat regression checks passed. The updated web container is healthy. A real public chat response was checked at https://vinodbalakumar.com/chat: source badges were absent and Message info still worked. The temporary test conversation was deleted.

The web-only deployment used `scripts/deploy-chat-sources-web.ps1`, preserving the previous image and reloading edge Nginx. Rollback metadata is in `outputs/chat-sources-web-rollback.json`. Public verification is recorded in `outputs/chat-sources-public-verification.json`; the mobile screenshot is `outputs/chat-sources-removed-mobile.png`.
