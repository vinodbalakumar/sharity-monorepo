# IONOS Production Deployment

Production deployment is documented for the Linux / IONOS environment.

## Model

- Environment: `production`
- Target host family: Linux
- Deployment style: Docker Compose
- Approval: required before production execution

## Responsibilities

- Build images from the source repositories
- Publish or reference the prepared images
- Restart the selected container
- Run health checks
- Roll back when the retry policy fails

## This repository does not

- Configure the Linux server directly
- Modify the application source repositories
- Deploy anything automatically in this commit
