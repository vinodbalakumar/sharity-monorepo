FROM node:22-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
ARG SHARITY_VITE_API_BASE_URL=
ARG SHARITY_VITE_TESLA_APP_URL=/tesla/
ARG SHARITY_VITE_COMPANY_NAME=Sharity
ARG SHARITY_VITE_COMPANY_TAGLINE="Smart business. shared rewards"
ENV VITE_API_BASE_URL=$SHARITY_VITE_API_BASE_URL
ENV VITE_TESLA_APP_URL=$SHARITY_VITE_TESLA_APP_URL
ENV VITE_COMPANY_NAME=$SHARITY_VITE_COMPANY_NAME
ENV VITE_COMPANY_TAGLINE=$SHARITY_VITE_COMPANY_TAGLINE
ENV VITE_BASE_PATH=/sharity-admin/
RUN npm run build

FROM nginx:1.27-alpine
COPY --from=build /app/dist /usr/share/nginx/html
RUN printf '%s\n' \
    'server {' \
    '  listen 8080;' \
    '  server_name _;' \
    '  root /usr/share/nginx/html;' \
    '  index index.html;' \
    '  gzip on;' \
    '  gzip_types text/plain text/css application/javascript application/json image/svg+xml;' \
    '  gzip_min_length 1024;' \
    '  location / { try_files $uri $uri/ /index.html; }' \
    '  location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|webp|woff2?)$ {' \
    '    expires 30d;' \
    '    add_header Cache-Control "public, immutable";' \
    '    try_files $uri =404;' \
    '  }' \
    '}' > /etc/nginx/conf.d/default.conf
EXPOSE 8080
CMD ["nginx", "-g", "daemon off;"]
