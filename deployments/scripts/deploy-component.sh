#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
source "$ROOT_DIR/scripts/component-map.sh"

workflow_from="main"
component="all"
deploy_environment="qa"
qa_target="mac"
traffic_mode="deploy_only"
rollback_enabled="true"
retry_count="3"
mode="${DEPLOY_MODE:-plan}"

usage() {
  cat <<'EOF'
Usage:
  deploy-component.sh [--workflow-from REF] [--component NAME] [--deploy-environment qa|prod]
                      [--qa-target windows|mac|linux] [--traffic-mode deploy_only|make_active]
                      [--rollback-enabled true|false] [--retry-count 1|2|3] [--mode plan|apply]

The default mode is plan so the repository can prepare workflows safely without deploying.
EOF
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --workflow-from) workflow_from="${2:-}"; shift 2 ;;
    --component) component="${2:-}"; shift 2 ;;
    --deploy-environment) deploy_environment="${2:-}"; shift 2 ;;
    --qa-target) qa_target="${2:-}"; shift 2 ;;
    --traffic-mode) traffic_mode="${2:-}"; shift 2 ;;
    --rollback-enabled) rollback_enabled="${2:-}"; shift 2 ;;
    --retry-count) retry_count="${2:-}"; shift 2 ;;
    --mode) mode="${2:-}"; shift 2 ;;
    -h|--help) usage; exit 0 ;;
    *)
      echo "Unknown argument: $1" >&2
      usage
      exit 1
      ;;
  esac
done

if ! component_is_supported "$component"; then
  echo "Unsupported component: $component" >&2
  exit 1
fi

if [[ "$deploy_environment" != "qa" && "$deploy_environment" != "prod" ]]; then
  echo "Unsupported deployment environment: $deploy_environment" >&2
  exit 1
fi

if [[ "$deploy_environment" == "qa" ]]; then
  if ! component_runner_labels "$qa_target" >/dev/null 2>&1; then
    echo "Unsupported QA target: $qa_target" >&2
    exit 1
  fi
fi

resolve_targets() {
  local target="$1"
  local -a ordered=()

  has_component() {
    local existing
    [[ ${#ordered[@]} -eq 0 ]] && return 1
    for existing in "${ordered[@]}"; do
      [[ "$existing" == "$1" ]] && return 0
    done
    return 1
  }

  add_component() {
    local candidate="$1"
    has_component "$candidate" && return 0
    local dep
    for dep in $(component_dependencies "$candidate"); do
      add_component "$dep"
    done
    ordered+=("$candidate")
  }

  if [[ "$target" == "all" ]]; then
    local c
    while IFS= read -r c; do
      add_component "$c"
    done < <(component_list)
  else
    add_component "$target"
  fi

  printf '%s\n' "${ordered[@]}"
}

print_plan() {
  local env_name
  env_name="qa"
  [[ "$deploy_environment" == "prod" ]] && env_name="production"
  {
    echo "## Sharity deployment plan"
    echo ""
    echo "- workflow_from: \`$workflow_from\`"
    echo "- component: \`$component\`"
    echo "- deploy_environment: \`$deploy_environment\`"
    echo "- qa_target: \`$qa_target\`"
    echo "- traffic_mode: \`$traffic_mode\`"
    echo "- rollback_enabled: \`$rollback_enabled\`"
    echo "- retry_count: \`$retry_count\`"
    echo "- mode: \`$mode\`"
    echo ""
    echo "### Derived runner labels"
    if [[ "$deploy_environment" == "qa" ]]; then
      echo "- \`$(component_runner_labels "$qa_target")\`"
    else
      echo "- \`production\` environment approval"
    fi
    echo ""
    echo "### Component matrix"
    echo ""
    echo "| component | repo | default branch | deployment branch | dockerfile | build command | image | health endpoint | compose service |"
    echo "| --- | --- | --- | --- | --- | --- | --- | --- | --- |"
    local target
    while IFS= read -r target; do
      printf '| %s | %s | %s | %s | %s | %s | %s | %s | %s |\n' \
        "$target" \
        "$(component_repo "$target")" \
        "$(component_default_branch "$target")" \
        "$(component_deployment_branch "$target")" \
        "$(component_dockerfile_path "$target")" \
        "$(component_build_command "$target")" \
        "$(component_image_name "$target")" \
        "$(component_health_endpoint "$target")" \
        "$(component_service "$target")"
    done < <(resolve_targets "$component")
    echo ""
    echo "### Rollback behaviour"
    echo "- retries: $retry_count"
    echo "- rollback: $rollback_enabled"
    echo "- QA route mode: $traffic_mode"
    echo ""
    echo "Plan only. No deployment was executed."
  } | tee -a "${GITHUB_STEP_SUMMARY:-/dev/null}"
}

if [[ "$mode" != "apply" ]]; then
  print_plan
  exit 0
fi

exec "$ROOT_DIR/scripts/deploy-component-with-rollback.sh" \
  --workflow-from "$workflow_from" \
  --component "$component" \
  --deploy-environment "$deploy_environment" \
  --qa-target "$qa_target" \
  --traffic-mode "$traffic_mode" \
  --rollback-enabled "$rollback_enabled" \
  --retry-count "$retry_count" \
  --mode "$mode"
