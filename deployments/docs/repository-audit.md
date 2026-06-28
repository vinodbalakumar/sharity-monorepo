# Repository Audit

| Repository | Default Branch | Deployment Branch | Dockerfile Path | Build Command | Image Name | Health Endpoint | Compose Service |
| --- | --- | --- | --- | --- | --- | --- | --- |
| authorization-server | `claude_cop_patch` | `claude_cop_patch` | `deployments/dockerfiles/authorization-server.Dockerfile` | `cd authorization-server && mvn clean package -DskipTests` | `sharity/authorization-server` | `/authorization-server/api/actuator/health` | `authorization-server` |
| marketplace-service | `claude_cop_patch` | `claude_cop_patch` | `deployments/dockerfiles/marketplace-service.Dockerfile` | `cd marketplace-service && mvn clean package -DskipTests` | `sharity/marketplace-service` | `/marketplace-service/internal/health` | `marketplace-service` |
| payment-service | `claude_cop_patch` | `claude_cop_patch` | `deployments/dockerfiles/payment-service.Dockerfile` | `cd payment-service && mvn clean package -DskipTests` | `sharity/payment-service` | `/payment-service/actuator/health` | `payment-service` |
| wallet-service | `claude_cop_patch` | `claude_cop_patch` | `deployments/dockerfiles/wallet-service.Dockerfile` | `cd wallet-service && mvn clean package -DskipTests` | `sharity/wallet-service` | `/wallet-service/internal/health` | `wallet-service` |
| platform-web-bff | `claude_cop_patch` | `claude_cop_patch` | `deployments/dockerfiles/platform-web-bff.Dockerfile` | `cd platform-web-bff && mvn clean package -DskipTests` | `sharity/platform-web-bff` | `/actuator/health` | `platform-web-bff` |
| sharity-app-ui | `claude_cop_patch` | `claude_cop_patch` | `deployments/dockerfiles/sharity-app.Dockerfile` | `cd sharity-app-ui && npm run build:web` | `sharity/sharity-app-ui` | `/` | `sharity-app` |

Notes:

- The deployment branch is standardized to `claude_cop_patch` for every component.
- GitHub Actions workflows are kept only in the `deployments` repository.
- QA target selection is metadata-driven and can reference `windows`, `mac`, or `linux`.
- The workflows are prepared for retry and rollback logic, but they do not deploy automatically in this repository state.
