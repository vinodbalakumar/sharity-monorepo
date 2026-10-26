"""Compare real browser evidence and sanitized timing logs after the local latency fix."""
import datetime
import json
from pathlib import Path
import re
import subprocess

from workspace_paths import workspace_root
root = workspace_root()
out = root/'outputs'
previous_report = out/'chat-latency-fix.json'
if previous_report.exists():
    previous = json.loads(previous_report.read_text(encoding='utf-8'))
    if previous.get('afterModel') == 'qwen3:0.6b':
        (out/'chat-latency-rejected-small-concurrency.json').write_text(json.dumps(dict(
            verifiedAt=previous['verifiedAt'], model='qwen3:0.6b', rejected=True,
            reason='Follow-up code-quality checks found incorrect Java and Spring examples.',
            requests=previous['after']), indent=2), encoding='utf-8')
before = json.loads((out/'chat-latency-before-concurrency.json').read_text(encoding='utf-8'))
after = json.loads((out/'deployed-chat-concurrency.json').read_text(encoding='utf-8'))
single = json.loads((out/'deployed-chat-public-verification.json').read_text(encoding='utf-8'))
path = json.loads((out/'chat-latency-path.json').read_text(encoding='utf-8'))
assert before['passed'] and after['passed'] and single['passed']
stages = {}
raw = subprocess.check_output(['docker','logs','--tail','2000','sharity-local-platform-ai-service-1'],stderr=subprocess.STDOUT,text=True)
for line in raw.splitlines():
    try:
        event = json.loads(line)
    except ValueError:
        continue
    if not event.get('message','').startswith('chat_completed '):
        continue
    fields = dict(re.findall(r'(durationMs|historyMs|modelMs|storageMs)=(\d+)',event['message']))
    stages[event.get('correlationId')] = {key:int(value) for key,value in fields.items()}
before_model = [row for row in before['requests'] if row['generation']=='OLLAMA']
before_by_session = {row['session']:row for row in before_model}
after_model = [row for row in after['requests'] if row['generation']=='OLLAMA']
for row in after['requests']:
    row['stages'] = stages.get(row.get('correlationId'),{})
assert all('modelMs' in row['stages'] for row in after_model), 'Missing deployed timing instrumentation'
old_mean = sum(row['durationMs'] for row in before_model)/len(before_model)
new_mean = sum(row['durationMs'] for row in after_model)/len(after_model)
report = dict(verifiedAt=datetime.datetime.now(datetime.timezone.utc).isoformat(),
    beforeModel='qwen3:1.7b', afterModel='qwen3:1.7b', before=before['requests'], after=after['requests'],
    beforeMeanMs=old_mean, afterMeanMs=new_mean, meanReductionPercent=round(100*(old_mean-new_mean)/old_mean,1),
    publicSingleChatTimingsMs=single['chatTimingsMs'], path=path)
(out/'chat-latency-fix.json').write_text(json.dumps(report,indent=2),encoding='utf-8')
lines = ['# Chat latency investigation and deployed fix','',
    f"Verified: {report['verifiedAt']}. Local Docker origin behind the existing public tunnel.",'',
    '## Cause','',
    '`platform-diagnostics-gateway` is outside the chat path. Chat uses browser → edge Nginx → BFF',
    '→ AI service → Windows Ollama. Diagnostic events use a separate background sender and private TLS gateway.',
    'Before the fix, paired request logs showed 24.5–27.8 seconds inside AI and only 40–167 ms of BFF overhead.',
    f"Observed diagnostic ingestion p95 was {path['diagnosticIngestionP95Ms']} ms across {path['diagnosticsRequests']} events.",
    'Direct Ollama probes confirmed CPU generation and model loading as the expensive operations.',
    'The Windows host has an i5-8350U (four cores/eight logical processors), 15.8 GB RAM and Intel UHD 620;',
    'Ollama runs on CPU. The larger model used about 1.6 GB at runtime and the host had about 1.1 GB free.',
    'Some model/option comparison probes required a runner reload; their cold-load timings are not warm-inference comparisons.',
    'Independent requests from the live site also arrived during the investigation; this was not an isolated load test.','',
    '## Changes','',
    '- Retained the original `qwen3:1.7b` model. A smaller model was briefly deployed, then reverted after follow-up quality checks found incorrect Java and Spring examples.',
    '- Model keep-alive increased from five to fifteen idle minutes, reducing repeated cold loads.',
    '- Programming requests ask for one complete example, required imports and brief explanations when requested.',
    '- Completion logs now record history, model and SQL storage times separately without prompts or answers.',
    '- Two concurrent model requests, factual-answer bypass, ownership checks and bounded rate limits remain enabled.',
    '- The previous application image remains available for rollback; diagnostics stayed enabled throughout verification.','',
    '## Real public browser verification','',
    '| Request | Before | After | Model time after | SQL storage after |',
    '|---|---:|---:|---:|---:|',
    *[f"| {new['session']} | {before_by_session[new['session']]['durationMs']/1000:.2f} s | {new['durationMs']/1000:.2f} s | {new['stages']['modelMs']/1000:.2f} s | {new['stages']['storageMs']} ms |" for new in after_model],'',
    f"Mean observed reduction for these two overlapping coding requests: {report['meanReductionPercent']}%.",
    f"Single-user smoke timings (structured, generated): {single['chatTimingsMs']} ms.",
    'Both concurrent requests returned HTTP 200. A third session received a factual answer while',
    'generation was pending. Cross-session history access returned 404 and temporary conversations were deleted.',
    'The separate single-user public smoke passed chat/refresh, code generation, SQL save/reload/delete,',
    'CSRF, mobile/theme, catalog, admin protection and OAuth start routing. HTTPS verification stayed enabled.',
    'AI Maven verify: 44 tests, 43 passed, one opt-in model test skipped; deployed checks used real Ollama.',
    'Evidence: `chat-latency-fix.json`, `deployed-chat-concurrency.json`, `deployed-chat-public-verification.json`,',
    '`chat-latency-verify.log`, and `ollama-latency-*.json`.','',
    '## Limits','',
    'These measurements cover a small set of synthetic prompts, not a throughput guarantee or broad quality evaluation.',
    'The rejected smaller-model experiment generated faster but failed code-quality checks; it is not the deployed model. Generated code still requires review.',
    'Cold starts, long prompts, concurrent load and memory pressure can still increase latency. Responses still wait',
    'for full generation; streaming is not implemented. Stronger quality and low latency at larger concurrency need more inference capacity.',
    'No payments, orders, public DNS or Tesla state were changed. Existing production/security gates remain documented.','',
    'Timing fields follow [Ollama API usage documentation](https://github.com/ollama/ollama/blob/main/docs/api/usage.mdx).',
    'Available model sizes are listed in [the official Qwen3 model library](https://ollama.com/library/qwen3).','']
(out/'chat-latency-report.md').write_text('\n'.join(lines),encoding='utf-8')
print(json.dumps({key:report[key] for key in ['beforeMeanMs','afterMeanMs','meanReductionPercent','publicSingleChatTimingsMs']},indent=2))
