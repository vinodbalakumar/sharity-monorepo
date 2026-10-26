"""Public synthetic prompts only. Record Ollama timing metadata separately from transport time."""
import argparse
import json
from pathlib import Path
import time
import urllib.request

parser = argparse.ArgumentParser()
parser.add_argument('--model', default='qwen3:8b')
parser.add_argument('--base-url', default='http://192.168.0.149:11434')
parser.add_argument('--output', default='ollama-latency-baseline.json')
parser.add_argument('--samples', type=int, default=1)
parser.add_argument('--concise', action='store_true')
args = parser.parse_args()
from workspace_paths import workspace_root
root = workspace_root()
questions = [
    'Write a short Java program to reverse a string.',
    'Explain Spring Boot dependency injection in three sentences.',
    'Generate a minimal Java Spring REST controller with a hello endpoint.',
    'Write a short Python program to reverse a string.',
]
results = []
for question in questions[:args.samples]:
    instruction = ('You are Sharity AI. Answer briefly. For code requests give one minimal complete fenced example including required imports, without prose unless asked. For explanations use at most three short sentences. No tools or code execution. You have no private account or deployment access. Never invent founder facts or claim completed actions.' if args.concise else
        'You are Sharity AI. Give a concise programming answer with fenced code blocks. No tools or code execution. You have no private account or deployment access. Never invent founder facts or claim completed actions.')
    payload = dict(model=args.model, stream=False, think=False, keep_alive='10m',
        messages=[dict(role='system', content=instruction), dict(role='user', content=question)],
        options=dict(num_ctx=8192, num_predict=1024, temperature=0.3, seed=42))
    started = time.perf_counter()
    request = urllib.request.Request(args.base_url.rstrip('/') + '/api/chat', json.dumps(payload).encode(), {'Content-Type':'application/json'})
    # LAN model traffic must not be sent to the workstation's internet proxy.
    with urllib.request.build_opener(urllib.request.ProxyHandler({})).open(request, timeout=120) as response:
        data = json.load(response)
    wall_ms = round((time.perf_counter()-started)*1000)
    result = dict(model=args.model, question=question, wallMs=wall_ms,
        **{key: data.get(key) for key in ['total_duration','load_duration','prompt_eval_duration','prompt_eval_count','eval_duration','eval_count','done_reason']},
        response=data['message']['content'])
    results.append(result)
    (root / 'outputs' / args.output).write_text(json.dumps(results, indent=2), encoding='utf-8')
    print(json.dumps({key:value for key,value in result.items() if key != 'response'}), flush=True)
