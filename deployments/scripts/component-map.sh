#!/usr/bin/env bash
set -euo pipefail

component_list() {
  printf '%s\n' \
    authorization-server \
    marketplace-service \
    payment-service \
    wallet-service \
    platform-web-bff \
    sharity-app-ui \
    nginx
}

component_repo() {
  case "$1" in
    authorization-server) echo "vinodbalakumar/authorization-server" ;;
    marketplace-service) echo "vinodbalakumar/marketplace-service" ;;
    payment-service) echo "vinodbalakumar/payment-service" ;;
    wallet-service) echo "vinodbalakumar/wallet-service" ;;
    platform-web-bff) echo "vinodbalakumar/platform-web-bff" ;;
    sharity-app-ui) echo "vinodbalakumar/sharity-app-ui" ;;
    nginx) echo "vinodbalakumar/deployments" ;;
    *) return 1 ;;
  esac
}

component_default_branch() {
  case "$1" in
    authorization-server|marketplace-service|payment-service|wallet-service|platform-web-bff|sharity-app-ui)
      echo "claude_cop_patch"
      ;;
    nginx)
      echo "main"
      ;;
    *) return 1 ;;
  esac
}

component_deployment_branch() {
  component_default_branch "$1"
}

component_service() {
  case "$1" in
    authorization-server) echo "authorization-server" ;;
    marketplace-service) echo "marketplace-service" ;;
    payment-service) echo "payment-service" ;;
    wallet-service) echo "wallet-service" ;;
    platform-web-bff) echo "platform-web-bff" ;;
    sharity-app-ui) echo "sharity-app" ;;
    nginx) echo "nginx" ;;
    *) return 1 ;;
  esac
}

component_dockerfile_path() {
  case "$1" in
    authorization-server) echo "dockerfiles/authorization-server.Dockerfile" ;;
    marketplace-service) echo "dockerfiles/marketplace-service.Dockerfile" ;;
    payment-service) echo "dockerfiles/payment-service.Dockerfile" ;;
    wallet-service) echo "dockerfiles/wallet-service.Dockerfile" ;;
    platform-web-bff) echo "dockerfiles/platform-web-bff.Dockerfile" ;;
    sharity-app-ui) echo "dockerfiles/sharity-app.Dockerfile" ;;
    nginx) echo "nginx/nginx.conf" ;;
    *) return 1 ;;
  esac
}

component_build_command() {
  case "$1" in
    authorization-server) echo "cd authorization-server && mvn clean package -DskipTests" ;;
    marketplace-service) echo "cd marketplace-service && mvn clean package -DskipTests" ;;
    payment-service) echo "cd payment-service && mvn clean package -DskipTests" ;;
    wallet-service) echo "cd wallet-service && mvn clean package -DskipTests" ;;
    platform-web-bff) echo "cd platform-web-bff && mvn clean package -DskipTests" ;;
    sharity-app-ui) echo "cd sharity-app-ui && npm run build:web" ;;
    nginx) echo "n/a" ;;
    *) return 1 ;;
  esac
}

component_image_name() {
  case "$1" in
    authorization-server) echo "sharity/authorization-server" ;;
    marketplace-service) echo "sharity/marketplace-service" ;;
    payment-service) echo "sharity/payment-service" ;;
    wallet-service) echo "sharity/wallet-service" ;;
    platform-web-bff) echo "sharity/platform-web-bff" ;;
    sharity-app-ui) echo "sharity/sharity-app-ui" ;;
    nginx) echo "nginx:1.27-alpine" ;;
    *) return 1 ;;
  esac
}

component_health_endpoint() {
  case "$1" in
    authorization-server) echo "/authorization-server/api/actuator/health" ;;
    marketplace-service) echo "/marketplace-service/internal/health" ;;
    payment-service) echo "/payment-service/actuator/health" ;;
    wallet-service) echo "/wallet-service/internal/health" ;;
    platform-web-bff) echo "/actuator/health" ;;
    sharity-app-ui) echo "/" ;;
    nginx) echo "nginx-config" ;;
    *) return 1 ;;
  esac
}

component_default_port() {
  case "$1" in
    authorization-server) echo "9091" ;;
    marketplace-service) echo "8084" ;;
    payment-service) echo "8085" ;;
    wallet-service) echo "8086" ;;
    platform-web-bff) echo "8083" ;;
    sharity-app-ui) echo "3001" ;;
    nginx) echo "8080" ;;
    *) return 1 ;;
  esac
}

component_runner_labels() {
  case "${1:-}" in
    windows) echo "self-hosted,Windows,sharity-qa" ;;
    mac) echo "self-hosted,macOS,ARM64,sharity-qa" ;;
    linux) echo "self-hosted,Linux,sharity-qa" ;;
    *) return 1 ;;
  esac
}

component_dependencies() {
  case "$1" in
    authorization-server) echo "" ;;
    marketplace-service) echo "authorization-server" ;;
    payment-service) echo "authorization-server" ;;
    wallet-service) echo "authorization-server" ;;
    platform-web-bff) echo "authorization-server marketplace-service payment-service wallet-service" ;;
    sharity-app-ui) echo "platform-web-bff marketplace-service authorization-server payment-service wallet-service" ;;
    nginx) echo "" ;;
    *) return 1 ;;
  esac
}

component_paths_for_changes() {
  case "$1" in
    authorization-server) printf '%s\n' 'authorization-server/' 'dockerfiles/authorization-server.Dockerfile' ;;
    marketplace-service) printf '%s\n' 'marketplace-service/' 'dockerfiles/marketplace-service.Dockerfile' ;;
    payment-service) printf '%s\n' 'payment-service/' 'dockerfiles/payment-service.Dockerfile' ;;
    wallet-service) printf '%s\n' 'wallet-service/' 'dockerfiles/wallet-service.Dockerfile' ;;
    platform-web-bff) printf '%s\n' 'platform-web-bff/' 'dockerfiles/platform-web-bff.Dockerfile' ;;
    sharity-app-ui) printf '%s\n' 'sharity-app-ui/' 'dockerfiles/sharity-app.Dockerfile' ;;
    nginx) printf '%s\n' 'nginx/' 'docker-compose*.yml' '.github/workflows/' 'deployment-manifest.yml' ;;
    all) printf '%s\n' 'docker-compose' '.github/workflows/' 'dockerfiles/' 'nginx/' ;;
    *) return 1 ;;
  esac
}

component_is_supported() {
  local candidate="$1"
  case "$candidate" in
    authorization-server|marketplace-service|payment-service|wallet-service|platform-web-bff|sharity-app-ui|nginx|all)
      return 0
      ;;
    *)
      return 1
      ;;
  esac
}

components_from_paths() {
  local path component
  local -a matches=()

  has_match() {
    local existing
    [[ ${#matches[@]} -eq 0 ]] && return 1
    for existing in "${matches[@]}"; do
      [[ "$existing" == "$1" ]] && return 0
    done
    return 1
  }

  while IFS= read -r path; do
    [[ -z "$path" ]] && continue
    case "$path" in
      dockerfiles/authorization-server.Dockerfile|authorization-server/*) component="authorization-server" ;;
      dockerfiles/marketplace-service.Dockerfile|marketplace-service/*) component="marketplace-service" ;;
      dockerfiles/payment-service.Dockerfile|payment-service/*) component="payment-service" ;;
      dockerfiles/wallet-service.Dockerfile|wallet-service/*) component="wallet-service" ;;
      dockerfiles/platform-web-bff.Dockerfile|platform-web-bff/*) component="platform-web-bff" ;;
      dockerfiles/sharity-app.Dockerfile|sharity-app-ui/*) component="sharity-app-ui" ;;
      nginx/*) component="nginx" ;;
      docker-compose*.yml|.github/workflows/*|deployment-manifest.yml)
        for component in $(component_list); do
          if ! has_match "$component"; then
            matches+=("$component")
          fi
        done
        continue
        ;;
      *)
        continue
        ;;
    esac

    if ! has_match "$component"; then
      matches+=("$component")
    fi
  done

  printf '%s\n' "${matches[@]}"
}
