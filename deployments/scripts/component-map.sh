#!/usr/bin/env bash
set -euo pipefail

component_list() {
  printf '%s\n' \
    authorization-server \
    marketplace-service \
    payment-service \
    wallet-service \
    platform-web-bff \
    sharity-app-ui
}

component_repo() {
  case "$1" in
    authorization-server) echo "vinodbalakumar/authorization-server" ;;
    marketplace-service) echo "vinodbalakumar/marketplace-service" ;;
    payment-service) echo "vinodbalakumar/payment-service" ;;
    wallet-service) echo "vinodbalakumar/wallet-service" ;;
    platform-web-bff) echo "vinodbalakumar/platform-web-bff" ;;
    sharity-app-ui) echo "vinodbalakumar/sharity-app-ui" ;;
    *) return 1 ;;
  esac
}

component_default_branch() {
  case "$1" in
    authorization-server|marketplace-service|payment-service|wallet-service|platform-web-bff|sharity-app-ui)
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
    *) return 1 ;;
  esac
}

component_dockerfile_path() {
  case "$1" in
    authorization-server) echo "deployments/dockerfiles/authorization-server.Dockerfile" ;;
    marketplace-service) echo "deployments/dockerfiles/marketplace-service.Dockerfile" ;;
    payment-service) echo "deployments/dockerfiles/payment-service.Dockerfile" ;;
    wallet-service) echo "deployments/dockerfiles/wallet-service.Dockerfile" ;;
    platform-web-bff) echo "deployments/dockerfiles/platform-web-bff.Dockerfile" ;;
    sharity-app-ui) echo "deployments/dockerfiles/sharity-app.Dockerfile" ;;
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
    *) return 1 ;;
  esac
}

component_health_endpoint() {
  case "$1" in
    authorization-server) echo "/authorization-server/api/actuator/health" ;;
    marketplace-service) echo "/marketplace-service/actuator/health" ;;
    payment-service) echo "/payment-service/actuator/health" ;;
    wallet-service) echo "/wallet-service/actuator/health" ;;
    platform-web-bff) echo "/actuator/health" ;;
    sharity-app-ui) echo "/" ;;
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
    *) return 1 ;;
  esac
}

component_is_supported() {
  local candidate="$1"
  case "$candidate" in
    authorization-server|marketplace-service|payment-service|wallet-service|platform-web-bff|sharity-app-ui|all)
      return 0
      ;;
    *)
      return 1
      ;;
  esac
}
