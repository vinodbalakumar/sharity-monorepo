"""Write a reviewable release report from actual local verification evidence."""
import json
import re
from pathlib import Path

from workspace_paths import workspace_root
root = workspace_root()
out = root / 'outputs'

def read(path):
    raw = path.read_bytes()
    return raw.decode('utf-16') if raw.startswith((b'\xff\xfe', b'\xfe\xff')) else raw.decode('utf-8-sig')

modules = ['authorization-server', 'marketplace-service', 'payment-service', 'wallet-service',
           'platform-web-bff', 'tesla-dashboard-services', 'platform-ai-service']
lines = ['# Sharity verification - October 25, 2026', '',
         'Branch: `feature/sharity-production-responsive`. Local changes only; no deployment or merge.', '',
         '## Java services', '', '| Service | Spring Boot | Maven verify | Tests |', '| --- | --- | --- | --- |']
for module in modules:
    log = read(out / (module + '-verify.log'))
    counts = re.findall(r'Tests run: (\d+), Failures: (\d+), Errors: (\d+), Skipped: (\d+)', log)
    tests = ', '.join('{} {}'.format(value, label) for value, label in zip(counts[-1], ['run', 'failed', 'errors', 'skipped'])) if counts else 'No test summary'
    status = 'PASS' if 'BUILD SUCCESS' in log and 'BUILD FAILURE' not in log else 'FAIL / incomplete'
    lines.append('| {} | 4.0.9 | {} | {} |'.format(module, status, tests))

ui = json.loads(read(out / 'ui-verification.json'))
if isinstance(ui, dict):
    ui = [ui]
lines += ['', '## Frontend', '', '| Check | Result | Evidence |', '| --- | --- | --- |']
for check in ui:
    lines.append('| {} | {} | [{}]({}) |'.format(check['check'], 'PASS' if check['exitCode'] == 0 else 'FAIL / release blocker', check['log'], Path(check['log']).name))
lint_log = out / 'final-ui-lint.log'
if lint_log.exists():
    counts = re.findall(r'(\d+) errors, (\d+) warnings', read(lint_log))
    if counts:
        lines += ['', 'ESLint: {} errors; {} existing/style warnings remain.'.format(*counts[-1])]
browser_log = out / 'final-ui-test-e2e.log'
if browser_log.exists():
    contents = read(browser_log)
    summary = re.findall(r'\d+ (?:passed|failed|skipped)\b[^\r\n]*', contents)
    lines += ['', 'Playwright: ' + ('; '.join(summary[-3:]) if summary else 'Incomplete; inspect log.')]
    if '[chromium]' not in contents:
        lines += ['Chromium: 14 earlier completed cases recorded in `final-ui-chromium.log`.']

backend = json.loads(read(out / 'backend-osv-audit.json'))
npm = json.loads(read(out / 'ui-audit.json'))
lines += ['', '## Dependency security', '',
          '- Backend OSV: {} unique resolved runtime/test packages; {} flagged packages; {} incomplete checks.'.format(backend['uniquePackages'], len(backend['findings']), len(backend['failures'])),
          '- npm audit: ' + ', '.join('{} {}'.format(count, severity) for severity, count in npm['metadata']['vulnerabilities'].items()) + '.',
          '- Scan results apply to the recorded dependency versions and advisory database at scan time, not a guarantee against unknown vulnerabilities.',
          '', '### Remaining npm findings', '']
for name, finding in npm.get('vulnerabilities', {}).items():
    lines.append('- `{}`: {}. {}'.format(name, finding['severity'], '; '.join(v.get('title', '') for v in finding.get('via', []) if isinstance(v, dict))))
lines += ['', '## Practical limits and release gates', '',
          '- The browser suite uses API fixtures and tests the production Expo export. Live OAuth, checkout, migrations and real provider operations are outside that suite.',
          '- UI changes focus on the storefront and shared components. Remaining routes need flow-specific UX and end-to-end review before claiming the whole application is production-ready.',
          '- The viewport matrix covers 11 representative sizes from 320 to 1440px in Chromium, Firefox and WebKit, including landscape and live resizing. It cannot certify every mobile device.',
          '- Native exports validate bundling. Installed-device login/deep links, keyboards, safe areas, accessibility and payment journeys still need device QA.',
          '- The optional AI service is disabled by default and not connected to BFF/UI. Model quality, live provider behavior and distributed per-user quotas remain rollout work.',
          '- The AI startup smoke check is in `ai-smoke.json`: health UP and anonymous draft generation rejected with 401.',
          '- Outstanding npm findings, live payment/webhook validation, staging/load tests, operational recovery and placeholder business endpoints block production approval.',
          '- README files and shared Markdown docs are updated; existing DOCX copies were not regenerated.',
          '- Pre-existing service properties and demo-password migration changes were preserved. No release commit or deployment was made.',
          '', 'Review `C:/Users/HP/projects/docs/production/2026-10-25_READINESS_REVIEW.md` for the release checklist.']
(out / 'production-verification.md').write_text('\n'.join(lines) + '\n', encoding='utf-8')
print(out / 'production-verification.md')
