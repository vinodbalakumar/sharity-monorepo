"""Public synthetic prompts only. Record Ollama timing metadata separately from transport time."""
import argparse
import json
from pathlib import Path
import time
import urllib.request

parser = argparse.ArgumentParser()
parser.add_argument('--model', default='qwen3:1.7b')
parser.add_argument('--threads', type=int, default=4)
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
    payload = dict(model=args.model, stream=False, think=False, keep_alive='15m',
        messages=[dict(role='system', content=instruction), dict(role='user', content=question)],
        options=dict(num_ctx=2048, num_predict=256, num_thread=args.threads, num_batch=128, num_gpu=0, temperature=0.2, seed=42))
    started = time.perf_counter()
    request = urllib.request.Request('http://127.0.0.1:11434/api/chat', json.dumps(payload).encode(), {'Content-Type':'application/json'})
    with urllib.request.urlopen(request, timeout=120) as response:
        data = json.load(response)
    wall_ms = round((time.perf_counter()-started)*1000)
    result = dict(model=args.model, threads=args.threads, question=question, wallMs=wall_ms,
        **{key: data.get(key) for key in ['total_duration','load_duration','prompt_eval_duration','prompt_eval_count','eval_duration','eval_count','done_reason']},
        response=data['message']['content'])
    results.append(result)
    (root / 'outputs' / args.output).write_text(json.dumps(results, indent=2), encoding='utf-8')
    print(json.dumps({key:value for key,value in result.items() if key != 'response'}), flush=True)
