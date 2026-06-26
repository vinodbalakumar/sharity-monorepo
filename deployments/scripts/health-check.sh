#!/usr/bin/env bash
set -euo pipefail

base_url=""
path="/"
timeout_seconds=60
interval_seconds=3

while [[ $# -gt 0 ]]; do
  case "$1" in
    --base-url) base_url="${2:-}"; shift 2 ;;
    --path) path="${2:-}"; shift 2 ;;
    --timeout-seconds) timeout_seconds="${2:-60}"; shift 2 ;;
    --interval-seconds) interval_seconds="${2:-3}"; shift 2 ;;
    *)
      echo "Unknown argument: $1" >&2
      exit 1
      ;;
  esac
done

if [[ -z "$base_url" ]]; then
  echo "--base-url is required" >&2
  exit 1
fi

deadline=$((SECONDS + timeout_seconds))
url="${base_url%/}${path}"

while (( SECONDS < deadline )); do
  if curl -fsS "$url" >/dev/null 2>&1; then
    echo "healthy: $url"
    exit 0
  fi
  sleep "$interval_seconds"
done

echo "health check timed out: $url" >&2
exit 1
