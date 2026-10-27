"""Summarize sanitized timing events; never write full application logs."""
import json
from pathlib import Path
import re
import subprocess

from workspace_paths import workspace_root
root = workspace_root()
timings = {}
diagnostics = []
for service in ['platform-web-bff', 'platform-ai-service']:
    raw = subprocess.check_output(['docker','logs','--tail','1500',f'sharity-local-{service}-1'], stderr=subprocess.STDOUT, text=True)
    for line in raw.splitlines():
        try:
            event = json.loads(line)
        except ValueError:
            continue
        message = event.get('message','')
        matched = re.fullmatch(r'request_completed correlationId=([A-Za-z0-9_-]+) method=POST route=(/bff/ai/chat|/internal/chat/chat|/internal/diagnostics/events) status=(\d+) durationMs=(\d+)', message)
        if not matched:
            continue
        correlation, route, status, duration = matched.groups()
        if route == '/internal/diagnostics/events':
            diagnostics.append(int(duration))
        elif status == '200':
            timings.setdefault(correlation,{})[service] = int(duration)
paired = [dict(aiMs=row['platform-ai-service'], bffMs=row['platform-web-bff'],
               bffOverheadMs=row['platform-web-bff']-row['platform-ai-service'])
          for row in timings.values() if len(row) == 2]
ordered = sorted(diagnostics)
report = dict(pairedChatRequests=paired, diagnosticsRequests=len(ordered),
    diagnosticIngestionP95Ms=ordered[max(0, int(len(ordered)*.95)-1)] if ordered else None,
    diagnosticIngestionMaxMs=max(ordered) if ordered else None)
(root/'outputs/chat-latency-path.json').write_text(json.dumps(report,indent=2),encoding='utf-8')
print(json.dumps(report,indent=2))
