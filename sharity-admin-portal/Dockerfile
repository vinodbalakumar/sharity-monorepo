FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
ARG VITE_API_BASE_URL=
ARG VITE_TESLA_APP_URL=https://vinodbalakumar.com/tesla
ARG VITE_COMPANY_NAME=Sharity
ARG VITE_COMPANY_TAGLINE="Smart business. shared rewards"
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
ENV VITE_TESLA_APP_URL=$VITE_TESLA_APP_URL
ENV VITE_COMPANY_NAME=$VITE_COMPANY_NAME
ENV VITE_COMPANY_TAGLINE=$VITE_COMPANY_TAGLINE
RUN npm run build

FROM nginx:1.27-alpine
COPY nginx/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
