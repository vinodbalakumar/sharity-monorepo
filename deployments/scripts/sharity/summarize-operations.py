"""Generate the follow-up report from actual verification artifacts."""
from pathlib import Path
import json
import re
import xml.etree.ElementTree as ET

from workspace_paths import workspace_root
root = workspace_root()
out = root / 'outputs'

def read(path):
    data = path.read_bytes()
    return data.decode('utf-16' if data.startswith((b'\xff\xfe', b'\xfe\xff')) else 'utf-8-sig', errors='replace')

results = json.loads(read(out / 'operations-backend-results.json'))
if isinstance(results, dict): results = [results]
if len(results) != 7 or any(item['exitCode'] for item in results):
    raise RuntimeError('All seven final Maven builds must pass before generating this report')

lines = ['# Sharity operations and commerce verification', '',
         'Branch: `feature/sharity-production-responsive`. Local, uncommitted work; not deployed.', '',
         '## Backend builds', '', '| Service | Maven verify | Tests |', '| --- | --- | --- |']
total = 0
for item in results:
    module = item['module']
    reports = list((root / module / 'target/surefire-reports').glob('TEST-*.xml'))
    newest = max(p.stat().st_mtime for p in reports)
    reports = [p for p in reports if p.stat().st_mtime >= newest - 300]
    suites = [ET.parse(str(p)).getroot() for p in reports]
    counts = {name: sum(int(s.get(name, '0')) for s in suites) for name in ['tests', 'failures', 'errors', 'skipped']}
    if counts['failures'] or counts['errors']: raise RuntimeError(module + ': failed tests')
    total += counts['tests']
    lines.append('| ' + module + ' | PASS | ' + str(counts['tests']) + ' run; 0 failed/errors |')
lines += ['', str(total) + ' backend tests passed. Logs: `release-<service>-verify.log`.',
          'Includes an embedded HTTP server test of diagnostic ingestion, token checks, metadata validation, the 4 KB body limit and anonymous admin rejection; role checks, AI-provider failure, log metadata bridging, cart ownership, pending payment and purchase idempotency also have tests.', '',
          '## UI and Expo', '']
checks = json.loads(read(out / 'operations-ui-checks.json'))
for item in checks:
    if item['exitCode'] != 0: raise RuntimeError(item['check'] + ' did not pass')
lines += ['- TypeScript: PASS.', '- ESLint: 0 errors; see `classic-ui-lint.log` for existing/style warnings.',
          '- Expo dependency compatibility and asset-parser regression checks: PASS.',
          '- Production web, Android and iOS exports: PASS. Native exports include the current promotion controls and an explicit HTTPS BFF origin. Installed-device behavior is not certified.',
          '- Full fixture-backed browser run: 71 passed; one Firefox browser/context closure during navigation. The session-recovery case passed on follow-up.',
          '- Follow-up checks passed for updated 320/390/1440 layouts, session recovery and promotion geometry across Chromium, Firefox and WebKit. A Firefox fractional-pixel assertion was corrected to round to hundredths of a pixel; its final targeted rerun passed.',
          '- The suite now defines 75 unique browser scenarios. See `classic-ui-e2e.log`, `classic-ui-followup.log` and `classic-ui-promotion-final.log` for the actual split-run results. These are API-fixture tests, not live OAuth/payment tests.', '']
if not re.search(r'\b1 passed\b', read(out / 'classic-ui-promotion-final.log')):
    raise RuntimeError('The final Firefox promotion rerun must pass')
if not re.search(r'\b71 passed\b', read(out / 'classic-ui-e2e.log')) or not re.search(r'\b14 passed\b', read(out / 'classic-ui-followup.log')):
    raise RuntimeError('Unexpected browser results; review the full logs before reporting')
audit = json.loads(read(out / 'operations-ui-audit.json'))['metadata']['vulnerabilities']
osv = json.loads(read(out / 'backend-osv-audit.json'))
lines += ['## Dependency scans', '',
          '- Backend OSV: ' + str(osv['uniquePackages']) + ' resolved runtime/test packages; ' + str(len(osv['findings'])) + ' affected packages; ' + str(len(osv['failures'])) + ' incomplete checks.',
          '- OpenTelemetry is pinned to 1.62.0 after fixing the baggage propagation advisory found in the starter defaults.',
          '- npm audit: ' + str(audit.get('high', 0)) + ' high, ' + str(audit.get('critical', 0)) + ' critical. The node-forge/Expo findings remain a release blocker.',
          '- Scans cover recorded dependency coordinates, not host Java, operating systems, container images or unknown vulnerabilities.', '',
          '## What remains before production', '',
          '- Provision the Ollama model, ingestion secret and retained monitoring backend; AI inference and telemetry delivery are opt-in and have not been validated against a live model here.',
          '- Finish provider-approved live checkout, webhook reconciliation, refunds/payouts, multi-item checkout, shipping/tax and protected digital delivery. Demo checkout is explicitly labelled and disabled by default in both marketplace and gateway transaction paths.',
          '- Validate live OAuth, native deep links and installed-device journeys, and apply/test Flyway V54 on MySQL/PostgreSQL. Database locking/idempotency unit tests do not prove database-level concurrent behavior.',
          '- Finish remaining legacy/mock routes, seller media/management, account-synced saved items and support messaging. This work does not establish complete Gameflip feature parity.',
          '- Resolve Expo findings; test load, recovery, multi-instance retention and alert delivery. The embedded recent-incident cache resets on restart.', '',
          'Setup, behavior and limitations: [OPERATIONS.md](../OPERATIONS.md). Shared Markdown documentation is updated in `C:/Users/HP/projects/docs`; existing DOCX copies are not regenerated.', '',
          'Visual previews use API fixtures: [mobile storefront](operations-mobile-preview.png) and [admin operations](operations-admin-preview.png).']
(out / 'operations-verification.md').write_text('\n'.join(lines) + '\n', encoding='utf-8')
print('Report written:', total, 'backend tests')
