# Docker Nginx Deployment

Run all deployment commands from:

```bash
C:\Users\HP\projects\deployments
```

Only Nginx publishes host port `8080`.

Routes:

- `http://localhost:8080/` -> redirects to Sharity admin portal
- `http://localhost:8080/sharity-admin/` -> `sharity-admin-portal:8080`
- `http://localhost:8080/tesla/` -> `tesla-dashboard-ui:8080`
- `http://localhost:8080/authorization-server/api/` -> `authorization-server:8080`
- `http://localhost:8080/tesla-dashboard-services/api/` -> `tesla-dashboard-services:8080`
- `http://localhost:8080/api/tesla/` -> compatibility route for Tesla UI API calls

MySQL is not created by Docker. Both backend containers connect to MySQL running on your PC through `host.docker.internal`.

Before starting, make sure these databases already exist in your PC MySQL:

- `auth`
- `tesla`

JWT keys are mounted from your PC:

- `C:\Users\HP\projects\certs\jwt-private.pem`
- `C:\Users\HP\projects\certs\jwt-public.pem`

The containers read those files as:

- `/keys/jwt-private.pem`
- `/keys/jwt-public.pem`

Create `.env` from `.env.example`, fill the PC MySQL credentials and SMTP values, then run:

```bash
docker compose up --build -d
```

Check status:

```bash
docker compose ps
docker compose logs -f nginx
```

Scale app containers:

```bash
docker compose up --build -d --scale authorization-server=2 --scale tesla-dashboard-services=2
```
