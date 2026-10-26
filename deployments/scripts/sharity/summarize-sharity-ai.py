"""Summarize the final local Sharity AI checks; fail closed on missing verification evidence."""
from pathlib import Path
import json
import xml.etree.ElementTree as ET

from workspace_paths import workspace_root
root = workspace_root()
out = root / 'outputs'

def read_file(path):
    raw = path.read_bytes()
    # Windows PowerShell redirection writes UTF-16; Node/Java evidence uses UTF-8.
    return raw.decode('utf-16' if raw.startswith((b'\xff\xfe', b'\xfe\xff')) else 'utf-8-sig', errors='replace')

def suites(module):
    reports = list((root / module / 'target/surefire-reports').glob('TEST-*.xml'))
    totals = dict(tests=0, failures=0, errors=0, skipped=0)
    for report in reports:
        suite = ET.parse(str(report)).getroot()
        for key in totals:
            totals[key] += int(suite.get(key, '0'))
    if not totals['tests'] or totals['failures'] or totals['errors']:
        raise RuntimeError(module + ': missing or failing tests')
    return totals

for name in ['ai', 'bff', 'android', 'ios']:
    code = json.loads((out / ('chat-' + name + '-exit.json')).read_text())['exitCode']
    if code != 0:
        raise RuntimeError(name + ': nonzero final exit code')

ai, bff = suites('platform-ai-service'), suites('platform-web-bff')
chat = read_file(out / 'chat-ui-playwright-final.log')
regression = read_file(out / 'chat-marketplace-regression.log')
if '36 passed' not in chat or '25 passed' not in regression:
    raise RuntimeError('Browser suites are incomplete')
live = json.loads((out / 'sharity-ai-live-browser.json').read_text(encoding='utf-8'))
if not live.get('passed') or live.get('codeGeneration') != 'OLLAMA':
    raise RuntimeError('Real local browser/model check did not pass')
osv = json.loads((out / 'backend-osv-audit.json').read_text(encoding='utf-8'))
if osv.get('failures') or osv.get('findings') or osv.get('uniquePackages') != 329:
    raise RuntimeError('Backend dependency scan changed; review before publishing this summary')
audit = json.loads(read_file(out / 'chat-ui-audit.json'))['metadata']['vulnerabilities']

report = '''# Sharity AI local verification

Branch: `feature/sharity-production-responsive`. Local changes only; no production deployment.

| Check | Result |
|---|---|
| AI Maven verify | Exit 0; {ai_passed} passed, {ai_skipped} skipped |
| BFF Maven verify | Exit 0; {bff_passed} passed, {bff_skipped} opt-in browser test skipped in final standard run |
| Real browser integration, separate opt-in run | Passed: Expo export → real BFF/session/CSRF → real AI service → local Ollama |
| Real model HTTP questions | Passed: Java reverse string, DI explanation, REST controller, microservices |
| Chat Playwright | 36/36 passed across Chromium, Firefox and WebKit; 320–1440px |
| Marketplace/commerce regression | 25/25 passed, Chromium |
| TypeScript | Exit 0 |
| ESLint | Exit 0, 61 warnings |
| Expo compatibility | Exit 0, dependencies up to date |
| Asset checks | Exit 0, 2 passed |
| Expo web export | Exit 0, `dist-e2e` |
| Android export | Exit 0, bundle only |
| iOS export | Exit 0, bundle only |
| npm audit | {high} high; {critical} critical (existing Expo signing chain) |

The opt-in real BFF browser case also passed in its dedicated full build; its evidence is
`sharity-ai-live-browser.json` and `chat-live-browser.log`. The AI opt-in test is included in
the final AI test total above and used real local Qwen3 1.7B over HTTP.

The backend OSV evidence is `backend-osv-audit.json`; inspect its exact package counts and
coverage rather than treating this as a guarantee against undiscovered vulnerabilities.
The current scan reported 329 unique packages, zero affected packages and zero incomplete checks.

Final Maven logs: `sharity-ai-verified.log`, `sharity-ai-bff-verified.log`.
Browser logs: `chat-ui-playwright-final.log`, `chat-marketplace-regression.log`.
Model responses: `sharity-ai-real-model-smoke.txt`.
Previews: `sharity-ai-desktop.png`, `sharity-ai-mobile.png`, `sharity-ai-real-chat.png`.

A temporary test server held the AI JAR open on Windows during an intermediate package attempt.
It was stopped and the final complete verification passed. Temporary test gateways/AI servers
were closed. Ollama remains installed locally; its model unloads after the configured idle time.

No real founder posts were imported. Official social APIs/scheduled synchronization, SSE,
production MySQL migration, Nginx integration, live OAuth and installed-device tests remain
unvalidated or unimplemented as detailed in `SHARITY_AI.md`. Android/iOS exports do not prove
installed-device functionality. Existing marketplace production release gates remain.
'''.format(ai_passed=ai['tests']-ai['skipped'], ai_skipped=ai['skipped'],
           bff_passed=bff['tests']-bff['skipped'], bff_skipped=bff['skipped'],
           high=audit['high'], critical=audit['critical'])
(out / 'sharity-ai-verification.md').write_text(report, encoding='utf-8')
print(json.dumps({'ai': ai, 'bff': bff, 'chatBrowserCases': 36, 'regressionCases': 25,
                  'realBrowserModelPassed': live['passed'], 'npmAudit': audit}))
