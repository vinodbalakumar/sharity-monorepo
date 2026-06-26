# Sharity Deployment Repo

This repository centralizes the deployment workflows and compose files for the Sharity services.

## Components

- authorization-server
- marketplace-service
- payment-service
- platform-web-bff
- sharity-app-ui
- wallet-service

## Workflows

- `qa-build-deploy.yml` - manual QA deployment.
- `prod-build-deploy.yml` - manual production deployment with environment approval.
- `component-build-deploy.yml` - reusable component deploy workflow.

## Compose files

- `docker-compose.mac.yml` - Mac QA/self-hosted runner deployment.
- `docker-compose.prod.yml` - IONOS production deployment.

## Notes

- No business logic is stored here.
- Application repositories are cloned at deploy time.
- Images are built from the source repositories using the Dockerfiles in `deployments/dockerfiles/`.
- QA uses a Mac self-hosted runner.
- Production expects IONOS SSH access and secrets configured in GitHub.

## Required secrets / environment values

The workflows expect these values to be provided in GitHub Secrets or the runner environment:

- `SPRING_DATASOURCE_URL`
- `SPRING_DATASOURCE_USERNAME`
- `SPRING_DATASOURCE_PASSWORD`
- `SPRING_REDIS_HOST`
- `SPRING_REDIS_PORT`
- `AUTHORIZATION_SERVER_URL`
- `INTERNAL_SERVICE_TOKEN`
- `EXPO_PUBLIC_BFF_BASE_URL`
- `EXPO_PUBLIC_MARKETPLACE_BASE_URL`
- `EXPO_PUBLIC_ASSET_PUBLIC_BASE_URL`

Production SSH deploy also expects:

- `IONOS_HOST`
- `IONOS_USER`
- `IONOS_SSH_KEY`
- `IONOS_APP_DIR` (optional)

