#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
source "$ROOT_DIR/scripts/component-map.sh"

workflow_from="${1:-main}"
component="${2:-all}"
deploy_environment="${3:-qa}"

if ! component_is_supported "$component"; then
  echo "Unsupported component: $component" >&2
  exit 1
fi

compose_file="$ROOT_DIR/docker-compose.${deploy_environment}.yml"
if [[ ! -f "$compose_file" ]]; then
  echo "Missing compose file: $compose_file" >&2
  exit 1
fi

source_root="${SOURCE_ROOT:-$ROOT_DIR/sources}"
mkdir -p "$source_root"

slug_ref="$(echo "$workflow_from" | tr '[:upper:]' '[:lower:]' | tr '/:@ ' '----' | tr -cd 'a-z0-9_.-')"
if [[ -z "$slug_ref" ]]; then
  slug_ref="latest"
fi
image_tag="${deploy_environment}-${slug_ref}"

resolve_targets() {
  local target="$1"
  local -a ordered=()
  local -A seen=()

  add_component() {
    local candidate="$1"
    [[ -n "${seen[$candidate]:-}" ]] && return 0
    local deps dep
    deps="$(component_dependencies "$candidate")"
    if [[ -n "$deps" ]]; then
      for dep in $deps; do
        add_component "$dep"
      done
    fi
    seen["$candidate"]=1
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
  local dockerfile_path="$ROOT_DIR/$(component_dockerfile_path "$component_name")"
  local image_name
  image_name="$(component_image_name "$component_name")"

  local -a build_args=()
  if [[ "$component_name" == "sharity-app-ui" ]]; then
    build_args+=(
      --build-arg "EXPO_PUBLIC_BFF_BASE_URL=${EXPO_PUBLIC_BFF_BASE_URL:-https://vinodbalakumar.com/bff}"
      --build-arg "EXPO_PUBLIC_MARKETPLACE_BASE_URL=${EXPO_PUBLIC_MARKETPLACE_BASE_URL:-/marketplace-service/api/v1/marketplace}"
      --build-arg "EXPO_PUBLIC_ASSET_PUBLIC_BASE_URL=${EXPO_PUBLIC_ASSET_PUBLIC_BASE_URL:-https://pub-c431ffbb16cd4884aa6a22a5f177f00b.r2.dev}"
    )
  fi

  echo "Building ${component_name} from ${repo_dir}"
  docker build \
    -f "$dockerfile_path" \
    "${build_args[@]}" \
    -t "${image_name}:${image_tag}" \
    -t "${image_name}:latest" \
    "$repo_dir"
}

wait_for_service() {
  local component_name="$1"
  local port
  local health_path
  port="${2:-$(component_default_port "$component_name")}"
  health_path="$(component_health_endpoint "$component_name")"

  if [[ "$component_name" == "sharity-app-ui" ]]; then
    health_path="/"
  fi

  local tries=60
  while (( tries > 0 )); do
    if curl -fsS "http://127.0.0.1:${port}${health_path}" >/dev/null 2>&1; then
      echo "Healthy: ${component_name} on ${port}${health_path}"
      return 0
    fi
    tries=$((tries - 1))
    sleep 2
  done

  echo "Timed out waiting for ${component_name} on port ${port}" >&2
  return 1
}

write_env_file() {
  local env_file="$ROOT_DIR/.env.deploy"
  {
    echo "WORKFLOW_FROM=${workflow_from}"
    echo "DEPLOY_ENVIRONMENT=${deploy_environment}"
    echo "AUTHORIZATION_SERVER_IMAGE=$(component_image_name authorization-server):${image_tag}"
    echo "MARKETPLACE_SERVICE_IMAGE=$(component_image_name marketplace-service):${image_tag}"
    echo "PAYMENT_SERVICE_IMAGE=$(component_image_name payment-service):${image_tag}"
    echo "WALLET_SERVICE_IMAGE=$(component_image_name wallet-service):${image_tag}"
    echo "PLATFORM_WEB_BFF_IMAGE=$(component_image_name platform-web-bff):${image_tag}"
    echo "SHARITY_APP_IMAGE=$(component_image_name sharity-app-ui):${image_tag}"
    echo "AUTHORIZATION_SERVER_PORT=${AUTHORIZATION_SERVER_PORT:-9091}"
    echo "MARKETPLACE_SERVICE_PORT=${MARKETPLACE_SERVICE_PORT:-8084}"
    echo "PAYMENT_SERVICE_PORT=${PAYMENT_SERVICE_PORT:-8085}"
    echo "WALLET_SERVICE_PORT=${WALLET_SERVICE_PORT:-8086}"
    echo "PLATFORM_WEB_BFF_PORT=${PLATFORM_WEB_BFF_PORT:-8083}"
    echo "SHARITY_APP_PORT=${SHARITY_APP_PORT:-3001}"
    echo "NGINX_PORT=${NGINX_PORT:-8080}"
  } > "$env_file"
  echo "$env_file"
}

mapfile -t targets < <(resolve_targets "$component")

for target in "${targets[@]}"; do
  repo_slug="$(component_repo "$target")"
  repo_dir="$source_root/$target"
  sync_repo "$repo_dir" "$repo_slug" "$workflow_from"
  build_image "$target" "$repo_dir"
done

env_file="$(write_env_file)"

compose_args=(--env-file "$env_file" -f "$compose_file")

if [[ "$component" == "all" ]]; then
  services=()
  while IFS= read -r c; do
    services+=("$(component_service "$c")")
  done < <(component_list)
  services+=("nginx")
  docker compose "${compose_args[@]}" up -d --remove-orphans "${services[@]}"
  for target in "${targets[@]}"; do
    wait_for_service "$target"
  done
else
  services=()
  while IFS= read -r c; do
    services+=("$(component_service "$c")")
  done < <(resolve_targets "$component")
  services+=("nginx")
  docker compose "${compose_args[@]}" up -d --force-recreate "${services[@]}"
  for target in "${targets[@]}"; do
    wait_for_service "$target"
  done
fi

echo "Deployment completed: ${component} (${deploy_environment}) from ${workflow_from}"
