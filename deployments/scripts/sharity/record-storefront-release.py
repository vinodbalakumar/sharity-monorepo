from pathlib import Path
import json
import re
import subprocess
from datetime import datetime, timezone

from workspace_paths import workspace_root
root = workspace_root()
out = root / 'outputs'

def docker(*args):
    return subprocess.check_output(['docker', *args], encoding='utf-8').strip()

def passed(name):
    data = (out / name).read_bytes()
    text = data.decode('utf-16' if data.startswith(b'\xff\xfe') else 'utf-8-sig', errors='replace')
    if re.search(r'\b\d+ failed\b',text):
        raise RuntimeError('Failed browser checks: '+name)
    match = re.search(r'(\d+) passed', text)
    if not match:
        raise RuntimeError('No passing completion recorded: ' + name)
    return int(match.group(1))

browser = passed('storefront-playwright-final.log')
logout = passed('storefront-logout.log')
public = json.loads((out / 'storefront-public-verification.json').read_text(encoding='utf-8-sig'))
if public.get('failure') or public['errors'] or public['privateRequests']:
    raise RuntimeError('Public browser verification did not pass')
rollback = json.loads((out / 'storefront-web-rollback.json').read_text(encoding='utf-8-sig'))
core = json.loads((out / 'storefront-core-baseline.json').read_text(encoding='utf-8-sig'))
for service in core:
    if docker('inspect', '--format', '{{.Image}}', service['name']) != service['imageId']:
        raise RuntimeError('Unexpected backend image change: ' + service['name'])
if docker('inspect', '--format', '{{.State.Health.Status}}', 'sharity-local-sharity-app-1') != 'healthy':
    raise RuntimeError('Web container is not healthy')
image = docker('inspect', '--format', '{{.Image}}', 'sharity-local-sharity-app-1')
bundle = next((root / 'sharity-app-ui/dist-e2e/_expo/static/js/web').glob('index-*.js'))
import hashlib
bundle_hash = hashlib.sha256(bundle.read_bytes()).hexdigest()
container_hash = docker('exec', 'sharity-local-sharity-app-1', 'sha256sum', '/usr/share/nginx/html/_expo/static/js/web/' + bundle.name).split()[0]
if bundle_hash != container_hash:
    raise RuntimeError('Deployed JavaScript differs from the verified export')

report = '''# Storefront refresh deployment — October 26, 2026

Verified at {time}. Public entry: https://vinodbalakumar.com/app/.

## Result

The public landing page, customer home and all-products catalog share a simpler marketplace layout with a blue-and-white palette, system fonts, clear category navigation, search, prices and responsive product cards. Category catalogs and product details use the same shell and image fallback. React Native Paper was already installed; its provider, buttons, search and chips now share the application theme. No runtime UI dependency was added.

Signed-out visitors see the landing page for private account routes. Public catalog and product pages remain browsable. The app checks the BFF session; `login=success` alone no longer mounts Home. Explicit sign-in keeps a validated route intent for at most 15 minutes. Back from sign-in retains the previous public screen, and product URLs survive refresh. Sign-out clears the local navigation authentication state before private history can be revisited. Backend authorization remains mandatory.

Missing and failed product photos have category artwork. Demo seed records are labelled rather than displaying their unrelated shared photo. Related-product controls open the selected item. Product and related-list requests run concurrently; a related-list failure does not discard a valid requested product. The main catalog normally needs one listing request, with home featured listings as a fallback.

## Verification

- TypeScript: passed. ESLint: zero errors; existing warnings remain.
- Expo web, Android and iOS exports: passed. Expo package compatibility: passed.
- {browser} browser checks passed in Chromium, Firefox and WebKit, plus {logout} separate sign-out/history checks ({total} total). These are mocked API contract tests, not a claim of live payment completion.
- Typography and layout were checked at 320, 360, 375, 390, 412, 430, 667, 768, 820, 1024 and 1440px. Product gallery/summary geometry was checked at 320, 390, 768, 1024 and 1440px.
- Existing chat timing/token information, cart changes, checkout errors, disabled payments and administrator access checks passed.
- Actual public browser: {public_checks}. No browser errors or anonymous private API requests were observed. API listing records loaded: {listings}. No login credentials were submitted and no orders/payments were created.
- Before/after and mobile product screenshots are in workspace `outputs/storefront-*.png`.

## Deployment and rollback

Only `sharity-local-sharity-app-1` was updated using `scripts/deploy-storefront-web.ps1`. The script rejects an export older than application source, preserves the old image, checks container health, validates edge Nginx and reloads its upstream. Existing core/AI/gateway image IDs match the baseline. Tesla remains disabled. No database schema, payment configuration, DNS or tunnel changes were made.

- Deployed image ID: `{image}`.
- Rollback image: `{rollback}`.
- Verified bundle: `{bundle}`; SHA-256 `{hash}` matches the running container.

The existing compose release tag is reused; use the image ID above to identify this UI build. To roll back, tag the preserved image as `{release}`, run the existing local compose command with `up -d --no-deps --no-build sharity-app`, check health, then reload edge Nginx. See `scripts/deploy-storefront-web.ps1` for the exact compose files/env-file names. Do not print private env-file contents.

## Remaining release limits

This release improves storefront usability and navigation. It does not certify complete Flipkart/Gameflip feature parity or overall production readiness. Live payments remain disabled; provider reconciliation, remaining legacy/mock flows and installed-device native OAuth still need development/verification. Native exports are build artifacts, not device test results. Existing Expo security advisories were not resolved by this UI change. Existing DOCX documentation copies are historical; the Markdown guides are updated.
'''.format(time=datetime.now(timezone.utc).isoformat(),browser=browser,logout=logout,total=browser+logout,
public_checks='; '.join(public['checks']),listings=public.get('listingCount'),image=image,rollback=rollback['rollbackImage'],bundle=bundle.name,hash=bundle_hash,release=rollback['releaseImage'])
(out / 'storefront-deployment.md').write_text(report,encoding='utf-8')
from workspace_paths import docs_root
docs = docs_root()
(docs / 'production/STOREFRONT_REFRESH.md').write_text(report,encoding='utf-8')
for file,prefix in [
 (docs/'INDEX.md','> Storefront refresh: [UI and guest-navigation deployment](production/STOREFRONT_REFRESH.md), including public sign-in/Back verification and responsive browser checks.\n\n'),
 (docs/'production/2026-10-25_READINESS_REVIEW.md','> October 26 UI follow-up: [the storefront release](STOREFRONT_REFRESH.md) simplifies the design and fixes guest routing. Overall production approval still depends on the remaining gates.\n\n'),
 (root/'OPERATIONS.md','> Storefront deployment: see [the October 26 UI release](outputs/storefront-deployment.md) for the web rollback image, verified public behavior and unchanged backend image IDs.\n\n')]:
    text=file.read_text(encoding='utf-8')
    if prefix not in text:
        file.write_text(prefix+text,encoding='utf-8')
print(json.dumps({'browserChecks':browser+logout,'image':image,'bundleSha256':bundle_hash,'publicChecks':len(public['checks'])}))
