from pathlib import Path
import shutil

from workspace_paths import workspace_root
root = workspace_root()
from workspace_paths import docs_root
docs = docs_root()
index = docs / 'INDEX.md'
text = index.read_text(encoding='utf-8')
text = text.replace('Official social sync, production deployment, live OAuth/device validation and remaining commerce gates are still outstanding.',
    'Core Sharity, AI and the Expo web export are deployed to the local Docker origin behind the public tunnel; Tesla remains disabled by request. See [the deployment record](production/LOCAL_CORE_AI_DEPLOYMENT.md). Official social sync, live OAuth/device validation and remaining commerce gates are still outstanding.')
index.write_text(text, encoding='utf-8')
review = docs / 'production/2026-10-25_READINESS_REVIEW.md'
text = review.read_text(encoding='utf-8')
text = text.replace('Production approval remains pending. The prepared `/chat` Nginx snippet has not been applied; private production inference hosting, MySQL migration, real OAuth/device checks, existing Expo advisories and commerce release gates remain outstanding.',
    'Production approval remains pending. Core Sharity, AI, the Expo web export and `/chat` routing are deployed to the local Docker origin behind the existing public tunnel. The dedicated AI MySQL schema is applied. Tesla stays disabled by request. See [the deployment record](LOCAL_CORE_AI_DEPLOYMENT.md). Independent inference hosting, real OAuth/device checks, existing Expo advisories and commerce release gates remain outstanding.')
review.write_text(text, encoding='utf-8')
for source, target in [('SHARITY_AI.md', 'SHARITY_AI.md'), ('OPERATIONS.md', 'AI_OPERATIONS_AND_COMMERCE.md')]:
    text = (root / source).read_text(encoding='utf-8')
    text = text.replace('(outputs/local-deployment-report.md)', '(../production/LOCAL_CORE_AI_DEPLOYMENT.md)')
    text = text.replace('(outputs/chat-latency-report.md)', '(../production/CHAT_LATENCY_INVESTIGATION.md)')
    (docs / 'architecture' / target).write_text(text, encoding='utf-8')
shutil.copyfile(root / 'outputs/local-deployment-report.md', docs / 'production/LOCAL_CORE_AI_DEPLOYMENT.md')
if (root / 'outputs/chat-latency-report.md').exists():
    shutil.copyfile(root / 'outputs/chat-latency-report.md', docs / 'production/CHAT_LATENCY_INVESTIGATION.md')
    for path, target in [(index, 'production/CHAT_LATENCY_INVESTIGATION.md'), (review, 'CHAT_LATENCY_INVESTIGATION.md')]:
        text = path.read_text(encoding='utf-8')
        if target not in text:
            text = f'> Local AI performance follow-up: see [the latency investigation]({target}) for the CPU/model bottleneck, deployed fix and before/after public browser measurements.\n\n' + text
            path.write_text(text, encoding='utf-8')
print('Updated shared architecture, readiness, index and deployment documentation.')
if (root / 'outputs/chat-info-deployment.md').exists():
    shutil.copyfile(root / 'outputs/chat-info-deployment.md', docs / 'production/CHAT_INFO_DEPLOYMENT.md')
    for path, target in [(index, 'production/CHAT_INFO_DEPLOYMENT.md'), (review, 'CHAT_INFO_DEPLOYMENT.md')]:
        text = path.read_text(encoding='utf-8')
        if target not in text:
            path.write_text(f'> AI chat details: [timing and token information deployment]({target}) covers per-message Info, conversation totals and persisted usage verification.\n\n' + text, encoding='utf-8')
