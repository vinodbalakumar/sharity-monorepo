"""Write deployment evidence without exporting container environment variables."""
import datetime
import json
import re
from pathlib import Path
import subprocess

from workspace_paths import workspace_root
root = workspace_root()
out = root / 'outputs'
services = ['authorization-server', 'marketplace-service', 'payment-service', 'wallet-service',
            'platform-web-bff', 'platform-ai-service', 'platform-diagnostics-gateway', 'sharity-app',
            'sharity-admin-portal', 'nginx']
def docker(*args):
    return subprocess.check_output(['docker', *args], text=True).strip()

results = []
for service in services:
    name = f'sharity-local-{service}-1'
    state = json.loads(docker('inspect', '--format', '{{json .State}}', name))
    results.append(dict(service=service, status=state['Status'], health=state.get('Health', {}).get('Status', 'not-configured'),
                        image=docker('inspect', '--format', '{{.Config.Image}}', name),
                        imageId=docker('inspect', '--format', '{{.Image}}', name)))
assert all(row['status'] == 'running' for row in results)
assert all(row['health'] == 'healthy' for row in results[:8])
assert not docker('ps', '-q', '--filter', 'name=^/sharity-local-tesla-dashboard-services-1$'), 'Tesla must remain disabled'
(out / 'local-deployment-results.json').write_text(json.dumps(results, indent=2), encoding='utf-8')
smoke = json.loads((out / 'deployed-chat-public-verification.json').read_text(encoding='utf-8'))
assert smoke['passed'], 'Public smoke verification has not passed'
maven_stem = next(stem for stem in ['chat-info', 'chat-latency', 'chat-concurrency', 'deployment-ai-final'] if (out / f'{stem}-exit.json').exists())
verify = json.loads((out / f'{maven_stem}-exit.json').read_text(encoding='utf-8-sig'))
assert verify['exitCode'] == 0
maven_log = f'{maven_stem}-verify.log'
counts = re.findall(r'Tests run: (\d+), Failures: (\d+), Errors: (\d+), Skipped: (\d+)', (out / maven_log).read_text(encoding='utf-8'))[-1]
total, failures, errors, skipped = map(int, counts)
assert failures == errors == 0
concurrency_lines = []
if (out / 'deployed-chat-concurrency.json').exists():
    concurrency = json.loads((out / 'deployed-chat-concurrency.json').read_text(encoding='utf-8'))
    assert concurrency['passed'], 'Concurrent browser verification has not passed'
    concurrency_lines = ['## Concurrent chat follow-up', '',
        f"Verified: {concurrency['verifiedAt']}. Two independent browser sessions sent overlapping requests",
        'to the real deployed model; both returned HTTP 200. A third session received an approved',
        'factual answer before either generated response finished. Cross-session conversation access',
        'returned 404, and temporary conversations were deleted.',
        *[f"- {row['session']}: HTTP {row['status']}, {row['generation']}, {row['durationMs']} ms." for row in concurrency['requests']], '',
        'The former single-request semaphore was replaced with a configurable two-generation limit.',
        'Structured answers bypass inference capacity. Provider failures release generation permits.',
        'Ollama may serialize actual computation on CPU; this fix accepts two simultaneous callers',
        'without promising equal latency or unlimited capacity. Per-owner limits and overload protection remain.',
        'See `deployed-chat-concurrency.json` for evidence and `chat-latency-report.md` for the performance follow-up.', '']
state = json.loads((out / 'local-deployment-state.json').read_text(encoding='utf-8-sig'))
lines = [
    '# Core Sharity and AI local deployment', '',
    f"Verified: {datetime.datetime.now(datetime.timezone.utc).isoformat()}. Release: `{state['release']}`.", '',
    'Core Sharity, centralized AI, the diagnostic TLS gateway and the Expo web export are deployed',
    'to the existing `sharity-local` Docker stack on this Windows computer. The existing Cloudflare',
    'tunnel serves this origin at https://vinodbalakumar.com. No DNS, tunnel or IONOS deployment was changed.',
    'Tesla backend and frontend remain disabled at the owner\'s explicit request.', '',
    '| Service | State | Health |', '|---|---|---|',
    *[f"| {row['service']} | {row['status']} | {row['health']} |" for row in results], '',
    'The existing admin portal and edge Nginx keep their earlier images; edge routing was validated',
    'and reloaded. The eight updated application/gateway containers report healthy. Full image IDs',
    'are recorded in `local-deployment-results.json`.', '',
    '## Verified behavior', '',
    f"Public Playwright baseline smoke ({smoke['verifiedAt']}): **passed**, {len(smoke['tests'])} checks, no mocked backend responses.",
    *[f'- {key}: passed.' for key in smoke['tests']], '',
    f"Browser-observed chat response times (structured founder answer, real Qwen coding answer): {smoke['chatTimingsMs']} ms.",
    'The check creates and deletes a temporary anonymous conversation. It creates no orders or payments.',
    'Chromium used IPv4 mapping to the current public Cloudflare address and disabled QUIC to work',
    'around this computer\'s browser transport problem. HTTPS certificate verification stayed enabled.',
    f'Latest AI Maven verify: {total} tests, {total-skipped} passed, {skipped} opt-in local-model test skipped, no failures/errors.',
    'The public smoke separately exercised the actual deployed Ollama/Qwen model.',
    'Private diagnostic delivery passed the Java TLS certificate/hostname probe. Nginx config validation passed.', '',
    *concurrency_lines,
    '## Runtime and data', '',
    'The dedicated MySQL AI schema is applied. Its runtime account has only SELECT/INSERT/UPDATE/DELETE',
    'on that schema. Existing databases were preserved and backed up before rollout.',
    'Private BFF/diagnostic tokens and database credentials remain outside source control and the Expo bundle.',
    'AI and diagnostic gateway share the BFF network namespace; AI has no published host port.',
    'Ollama runs on Windows with `qwen3:1.7b`; it must remain available while this local origin is used.',
    'The model uses four threads, batch 128, context 2048 and at most 256 generated tokens.',
    'Chat allows two concurrent model calls; structured answers bypass this limit. Model keep-alive is fifteen minutes.',
    'Programming prompts omit unrelated project passages. Inference incidents retain measured errors',
    'and timings but do not queue recursive model diagnosis. Other service triage remains advisory.',
    'Legacy marketplace SQL/parameter slow logging is disabled. Demo purchase flags remain false.',
    'Diagnostic TLS uses a private server certificate and a Java store retaining public CA roots;',
    'the 365-day certificate must be renewed with its trust store before expiry.', '',
    '## Recovery and remaining limits', '',
    f"Restricted backup directory: `{state['backupDirectory']}` (do not upload).",
    f"Database backup size: {state['databaseBackupBytes']} bytes. Original service images have",
    f"`rollback-{state['release']}` tags. Stop the shared-network AI/gateway before restoring an old BFF.",
    'Review later database writes before any database restore; additive schema migrations are not automatically reversed.',
    'See the deployment repository `docs/local-ai-deployment.md` for the Compose command and rollback procedure.', '',
    'This is a local-origin deployment, not certification of complete production readiness or Gameflip parity.',
    'The latest backend dependency scan checked 329 packages with no reported findings; the existing',
    'Expo dependency audit still has four high advisories. No claim of zero vulnerabilities is made.',
    'CPU/RAM headroom is limited; cold requests and concurrent inference still need load testing and capacity planning.',
    'Full signed-in OAuth/admin workflows, real payment/webhook reconciliation, installed native-device behavior',
    'and Tesla Fleet were not verified by this deployment smoke. Android/iOS exports are not app-store deployments.',
    'Official social API/scheduled synchronization and SSE remain unimplemented; no real social posts were imported.',
    'Incident history is an in-memory bounded cache, not durable monitoring. Retained telemetry, alerting,',
    'provider capacity, recovery drills and commerce release gates remain necessary.',
    'Source changes remain local and uncommitted on the existing development branch.', '',
]
(out / 'local-deployment-report.md').write_text('\n'.join(lines), encoding='utf-8')
print('Recorded healthy core deployment, public browser verification and remaining limits.')
