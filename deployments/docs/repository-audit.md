# Repository Audit

| Repository | Default Branch | Deployment Branch | Dockerfile Path | Build Command | Image Name | Health Endpoint | Compose Service |
| --- | --- | --- | --- | --- | --- | --- | --- |
| authorization-server | main | main | `deployments/dockerfiles/authorization-server.Dockerfile` | `cd authorization-server && mvn clean package -DskipTests` | `sharity/authorization-server` | `/authorization-server/api/actuator/health` | `authorization-server` |
| marketplace-service | main | main | `deployments/dockerfiles/marketplace-service.Dockerfile` | `cd marketplace-service && mvn clean package -DskipTests` | `sharity/marketplace-service` | `/marketplace-service/actuator/health` | `marketplace-service` |
| payment-service | main | main | `deployments/dockerfiles/payment-service.Dockerfile` | `cd payment-service && mvn clean package -DskipTests` | `sharity/payment-service` | `/payment-service/actuator/health` | `payment-service` |
| wallet-service | main | main | `deployments/dockerfiles/wallet-service.Dockerfile` | `cd wallet-service && mvn clean package -DskipTests` | `sharity/wallet-service` | `/wallet-service/actuator/health` | `wallet-service` |
| platform-web-bff | main | main | `deployments/dockerfiles/platform-web-bff.Dockerfile` | `cd platform-web-bff && mvn clean package -DskipTests` | `sharity/platform-web-bff` | `/actuator/health` | `platform-web-bff` |
| sharity-app-ui | main | main | `deployments/dockerfiles/sharity-app.Dockerfile` | `cd sharity-app-ui && npm run build:web` | `sharity/sharity-app-ui` | `/` | `sharity-app` |

Notes:

- All workflows live only in the `deployments` repository.
- No runner is configured here beyond the default GitHub Actions execution environment.
- No deployment is executed by these workflows; they only prepare and summarize the plan.

