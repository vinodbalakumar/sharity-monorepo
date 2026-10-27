#!/usr/bin/env bash
set -euo pipefail

target=""
component="all"
state_dir="${STATE_DIR:-$PWD/.state}"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --target) target="${2:-}"; shift 2 ;;
    --component) component="${2:-all}"; shift 2 ;;
    *)
      echo "Unknown argument: $1" >&2
      exit 1
      ;;
  esac
done

case "$target" in
  windows|mac|linux) ;;
  *)
    echo "Unsupported QA target: $target" >&2
    exit 1
    ;;
esac

mkdir -p "$state_dir"
printf '%s\n' "$target" > "$state_dir/active-qa-target.txt"

cat <<EOF
QA routing plan
active_target=$target
component=$component
state_file=$state_dir/active-qa-target.txt
EOF
