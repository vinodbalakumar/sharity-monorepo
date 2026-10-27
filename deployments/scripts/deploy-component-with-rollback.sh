#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
source "$ROOT_DIR/scripts/component-map.sh"

workflow_from="claude_cop_patch"
component="all"
deploy_environment="qa"
qa_target="mac"
traffic_mode="deploy_only"
rollback_enabled="true"
retry_count="3"
mode="${DEPLOY_MODE:-plan}"
source_root="${SOURCE_ROOT:-${SHARITY_SOURCE_ROOT:-$ROOT_DIR/sources}}"

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
    *)
      echo "Unknown argument: $1" >&2
      exit 1
      ;;
  esac
done

if ! component_is_supported "$component"; then
  echo "Unsupported component: $component" >&2
  exit 1
fi

  if [[ "$mode" != "apply" ]]; then
  {
    echo "Rollback-aware deployment plan"
    echo "workflow_from=$workflow_from"
    echo "component=$component"
    echo "deploy_environment=$deploy_environment"
    echo "qa_target=$qa_target"
    echo "traffic_mode=$traffic_mode"
    echo "rollback_enabled=$rollback_enabled"
    echo "retry_count=$retry_count"
  } | tee -a "${GITHUB_STEP_SUMMARY:-/dev/null}"
  exit 0
fi

compose_file="$ROOT_DIR/docker-compose.${deploy_environment}.yml"
if [[ "$deploy_environment" == "qa" && ! -f "$compose_file" ]]; then
  compose_file="$ROOT_DIR/docker-compose.${qa_target}.yml"
fi

if [[ ! -f "$compose_file" ]]; then
  echo "Missing compose file: $compose_file" >&2
  exit 1
fi

mkdir -p "$source_root"

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

sync_repo() {
  local repo_dir="$1"
  local repo_slug="$2"
  local ref="$3"
  local remote_url="https://github.com/${repo_slug}.git"

  if [[ ! -d "$repo_dir/.git" ]]; then
    rm -rf "$repo_dir"
    git clone --depth 1 --branch "$ref" "$remote_url" "$repo_dir" >/dev/null 2>&1 || true
  fi

  if [[ ! -d "$repo_dir/.git" ]]; then
    git init "$repo_dir" >/dev/null
    git -C "$repo_dir" remote add origin "$remote_url" || true
  fi

  git -C "$repo_dir" fetch --prune --tags origin "$ref" >/dev/null 2>&1 || git -C "$repo_dir" fetch --prune --tags origin >/dev/null 2>&1
  if git -C "$repo_dir" rev-parse --verify "origin/$ref" >/dev/null 2>&1; then
    git -C "$repo_dir" checkout -f "origin/$ref" >/dev/null
  elif git -C "$repo_dir" rev-parse --verify "$ref" >/dev/null 2>&1; then
    git -C "$repo_dir" checkout -f "$ref" >/dev/null
  else
    git -C "$repo_dir" checkout -f FETCH_HEAD >/dev/null 2>&1 || true
  fi

  git -C "$repo_dir" reset --hard >/dev/null 2>&1 || true
  git -C "$repo_dir" clean -fdx >/dev/null 2>&1 || true
}

build_image() {
  local component_name="$1"
  local repo_dir="$2"
  if [[ "$component_name" == "nginx" ]]; then
    return 0
  fi
  local dockerfile_path="$ROOT_DIR/$(component_dockerfile_path "$component_name")"
  local image_name
  image_name="$(component_image_name "$component_name")"
  local tag="${deploy_environment}-${workflow_from}"
  tag="${tag//[^a-zA-Z0-9_.-]/-}"

  local -a build_args=()
  if [[ "$component_name" == "sharity-app-ui" ]]; then
    build_args+=(
      --build-arg "EXPO_PUBLIC_BFF_BASE_URL=${EXPO_PUBLIC_BFF_BASE_URL:-https://vinodbalakumar.com/bff}"
      --build-arg "EXPO_PUBLIC_MARKETPLACE_BASE_URL=${EXPO_PUBLIC_MARKETPLACE_BASE_URL:-/marketplace-service/api/v1/marketplace}"
      --build-arg "EXPO_PUBLIC_ASSET_PUBLIC_BASE_URL=${EXPO_PUBLIC_ASSET_PUBLIC_BASE_URL:-https://pub-c431ffbb16cd4884aa6a22a5f177f00b.r2.dev}"
    )
  fi

  if [[ ${#build_args[@]} -gt 0 ]]; then
    docker build \
      --pull=false \
      -f "$dockerfile_path" \
      "${build_args[@]}" \
      -t "${image_name}:${tag}" \
      -t "${image_name}:latest" \
      "$repo_dir"
  else
    docker build \
      --pull=false \
      -f "$dockerfile_path" \
      -t "${image_name}:${tag}" \
      -t "${image_name}:latest" \
      "$repo_dir"
  fi
}

health_endpoint_for() {
  component_health_endpoint "$1"
}

wait_for_service() {
  local component_name="$1"
  local base_url="${2:-http://127.0.0.1}"
  local port="${3:-$(component_default_port "$component_name")}"
  local health_path
  health_path="$(health_endpoint_for "$component_name")"
  local attempt=0
  local max_attempts="${retry_count:-3}"

  if [[ "$component_name" == "nginx" ]]; then
    while (( attempt < max_attempts )); do
      if docker inspect -f '{{.State.Health.Status}}' sharity-nginx 2>/dev/null | grep -q '^healthy$'; then
        return 0
      fi
      attempt=$((attempt + 1))
      sleep 3
    done
    return 1
  fi

  while (( attempt < max_attempts )); do
    if "$ROOT_DIR/scripts/health-check.sh" --base-url "$base_url:$port" --path "$health_path" --timeout-seconds 90; then
      return 0
    fi
    attempt=$((attempt + 1))
    sleep 3
  done

  return 1
}

write_env_file() {
  local pc_mysql_host="${PC_MYSQL_HOST:-${DB_HOST:-}}"
  local pc_mysql_port="${PC_MYSQL_PORT:-${DB_PORT:-3306}}"
  local pc_mysql_username="${PC_MYSQL_USERNAME:-${DB_USERNAME:-}}"
  local pc_mysql_password="${PC_MYSQL_PASSWORD:-${DB_PASSWORD:-}}"

  if [[ -z "$pc_mysql_host" || -z "$pc_mysql_username" || -z "$pc_mysql_password" ]]; then
    echo "Windows MySQL settings are required: set PC_MYSQL_HOST/PC_MYSQL_USERNAME/PC_MYSQL_PASSWORD or DB_HOST/DB_USERNAME/DB_PASSWORD." >&2
    exit 1
  fi

  local tag="${deploy_environment}-${workflow_from}"
  tag="${tag//[^a-zA-Z0-9_.-]/-}"
  local env_file="$ROOT_DIR/.env.deploy"
  {
    echo "WORKFLOW_FROM=${workflow_from}"
    echo "DEPLOY_ENVIRONMENT=${deploy_environment}"
    echo "QA_TARGET=${qa_target}"
    echo "TRAFFIC_MODE=${traffic_mode}"
    echo "ROLLBACK_ENABLED=${rollback_enabled}"
    echo "RETRY_COUNT=${retry_count}"
    echo "CERTS_DIR=${CERTS_DIR:-}"
    echo "PC_MYSQL_HOST=${pc_mysql_host}"
    echo "PC_MYSQL_PORT=${pc_mysql_port}"
    echo "PC_MYSQL_USERNAME=${pc_mysql_username}"
    echo "PC_MYSQL_PASSWORD=${pc_mysql_password}"
    echo "AUTH_DB_NAME=${AUTH_DB_NAME:-auth}"
    echo "BFF_DB_NAME=${BFF_DB_NAME:-auth}"
    echo "MARKETPLACE_DB_NAME=${MARKETPLACE_DB_NAME:-marketplace_db}"
    echo "PAYMENT_DB_NAME=${PAYMENT_DB_NAME:-payment_db}"
    echo "WALLET_DB_NAME=${WALLET_DB_NAME:-wallet_db}"
    echo "AUTHORIZATION_SERVER_IMAGE=$(component_image_name authorization-server):${tag}"
    echo "MARKETPLACE_SERVICE_IMAGE=$(component_image_name marketplace-service):${tag}"
    echo "PAYMENT_SERVICE_IMAGE=$(component_image_name payment-service):${tag}"
    echo "WALLET_SERVICE_IMAGE=$(component_image_name wallet-service):${tag}"
    echo "PLATFORM_WEB_BFF_IMAGE=$(component_image_name platform-web-bff):${tag}"
    echo "SHARITY_APP_IMAGE=$(component_image_name sharity-app-ui):${tag}"
  } > "$env_file"
  echo "$env_file"
}

image_env_var_for() {
  case "$1" in
    authorization-server) echo "AUTHORIZATION_SERVER_IMAGE" ;;
    marketplace-service) echo "MARKETPLACE_SERVICE_IMAGE" ;;
    payment-service) echo "PAYMENT_SERVICE_IMAGE" ;;
    wallet-service) echo "WALLET_SERVICE_IMAGE" ;;
    platform-web-bff) echo "PLATFORM_WEB_BFF_IMAGE" ;;
    sharity-app-ui) echo "SHARITY_APP_IMAGE" ;;
    *) return 1 ;;
  esac
}

capture_previous_image() {
  local component_name="$1"
  local service
  local image_name
  local container_id
  local current_image
  local backup_tag

  service="$(component_service "$component_name")"
  image_name="$(component_image_name "$component_name")"
  container_id="$(docker compose -f "$compose_file" ps -q "$service" 2>/dev/null || true)"
  if [[ -z "$container_id" ]]; then
    echo ""
    return 0
  fi

  current_image="$(docker inspect -f '{{.Image}}' "$container_id" 2>/dev/null || true)"
  if [[ -z "$current_image" ]]; then
    echo ""
    return 0
  fi

  backup_tag="${image_name}:previous"
  docker tag "$current_image" "$backup_tag" >/dev/null 2>&1 || true
  echo "$backup_tag"
}

rewrite_env_image() {
  local env_file="$1"
  local component_name="$2"
  local image_ref="$3"
  local var_name
  var_name="$(image_env_var_for "$component_name")"
  if grep -q "^${var_name}=" "$env_file"; then
    sed -i.bak "s|^${var_name}=.*|${var_name}=${image_ref}|" "$env_file"
    rm -f "${env_file}.bak"
  fi
}

targets=()
while IFS= read -r target; do
  targets+=("$target")
done < <(resolve_targets "$component")

previous_components=()
previous_images=()

previous_image_for() {
  local component_name="$1"
  local index
  for index in "${!previous_components[@]}"; do
    if [[ "${previous_components[$index]}" == "$component_name" ]]; then
      echo "${previous_images[$index]}"
      return 0
    fi
  done
  echo ""
}

for target in "${targets[@]}"; do
  previous_components+=("$target")
  previous_images+=("$(capture_previous_image "$target")")
  if [[ "$target" == "nginx" ]]; then
    continue
  fi
  repo_slug="$(component_repo "$target")"
  repo_dir="$source_root/$target"
  sync_repo "$repo_dir" "$repo_slug" "$workflow_from"
  build_image "$target" "$repo_dir"
done

env_file="$(write_env_file)"
compose_args=(--env-file "$env_file" -f "$compose_file")

services=()
while IFS= read -r c; do
  services+=("$(component_service "$c")")
done < <(resolve_targets "$component")
services+=("nginx")

docker compose "${compose_args[@]}" up -d --remove-orphans "${services[@]}"

for target in "${targets[@]}"; do
  if ! wait_for_service "$target"; then
    previous_tag="$(previous_image_for "$target")"
    if [[ "$rollback_enabled" == "true" && -n "$previous_tag" ]]; then
      echo "Health check failed for $target; restoring ${previous_tag}"
      rewrite_env_image "$env_file" "$target" "${previous_tag}"
      docker compose "${compose_args[@]}" up -d --remove-orphans "${services[@]}"
      if ! wait_for_service "$target"; then
        echo "Rollback also failed for $target" >&2
        exit 1
      fi
    else
      echo "Health check failed for $target and rollback is disabled." >&2
      exit 1
    fi
  fi
done

if [[ "$traffic_mode" == "make_active" && "$deploy_environment" == "qa" ]]; then
  "$ROOT_DIR/scripts/make-active-qa-target.sh" --target "$qa_target" --component "$component"
fi

echo "Deployment completed successfully for $component ($deploy_environment)."
