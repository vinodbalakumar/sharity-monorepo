FROM node:22-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev
COPY . .
ARG EXPO_PUBLIC_BFF_BASE_URL=https://vinodbalakumar.com/bff
ARG EXPO_PUBLIC_SITE_BASE_URL=https://vinodbalakumar.com
ARG EXPO_PUBLIC_MARKETPLACE_BASE_URL=/marketplace-service/api/v1/marketplace
ARG EXPO_PUBLIC_ASSET_PUBLIC_BASE_URL=https://pub-c431ffbb16cd4884aa6a22a5f177f00b.r2.dev
ENV EXPO_PUBLIC_BFF_BASE_URL=$EXPO_PUBLIC_BFF_BASE_URL
ENV EXPO_NO_DOTENV=1
ENV EXPO_PUBLIC_BFF_PUBLIC_BASE_URL=$EXPO_PUBLIC_SITE_BASE_URL
ENV EXPO_PUBLIC_AUTH_BASE_URL=$EXPO_PUBLIC_SITE_BASE_URL/authorization-server/api/v1/auth
ENV EXPO_PUBLIC_AUTH_USER_BASE_URL=$EXPO_PUBLIC_SITE_BASE_URL/bff/api/authorization-server/api/v1
ENV EXPO_PUBLIC_WALLET_BASE_URL=$EXPO_PUBLIC_SITE_BASE_URL/bff/api/wallet-service/api/v1/wallet
ENV EXPO_PUBLIC_MARKETPLACE_BASE_URL=$EXPO_PUBLIC_MARKETPLACE_BASE_URL
ENV EXPO_PUBLIC_ASSET_PUBLIC_BASE_URL=$EXPO_PUBLIC_ASSET_PUBLIC_BASE_URL
RUN npm run build:web

FROM nginx:1.27-alpine
COPY --from=build /app/dist /usr/share/nginx/html
RUN printf '%s\n' \
    'server {' \
    '  listen 80;' \
    '  server_name _;' \
    '  root /usr/share/nginx/html;' \
    '  index index.html;' \
    '  gzip on;' \
    '  gzip_types text/plain text/css application/javascript application/json image/svg+xml;' \
    '  gzip_min_length 1024;' \
    '  location = /index.html {' \
    '    add_header Cache-Control "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0";' \
    '    expires -1;' \
    '    try_files $uri =404;' \
    '  }' \
    '  location / { try_files $uri $uri/ /index.html; }' \
    '  location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|webp|woff2?)$ {' \
    '    expires 30d;' \
    '    add_header Cache-Control "public, immutable";' \
    '    try_files $uri =404;' \
    '  }' \
    '}' > /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
