# Sharity GitHub Actions Deployment Guide

This repository holds the deployment workflow definitions for Sharity.

## Workflow files

- `qa-build-deploy.yml`
- `prod-build-deploy.yml`
- `component-build-deploy.yml`
- `qa-auto-deploy.yml`

## Supported inputs

- `workflow_from`
- `component`
- `qa_target`
- `deploy_environment`
- `traffic_mode`
- `rollback_enabled`
- `retry_count`

## Deployment branch

All repositories are standardized to the `claude_cop_patch` deployment branch in the manifest.

## Current workflow behavior

- The workflows prepare deployment plans from the manifest and helper scripts.
- Retry and rollback metadata is captured in the scripts.
- QA routing is documented as a single-active-target design.
- No business logic or API contracts are changed here.
- The QA workflow uses flag-based `deploy-component.sh` arguments with `--mode apply`, so `component=all` expands safely to the full stack.

## Execution model

- QA can reference `windows`, `mac`, or `linux` targets.
- Production references the IONOS/Linux deployment model.
- The workflows are prepared in the repository only; they do not deploy anything by themselves.

