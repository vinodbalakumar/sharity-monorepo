FROM nginx:1.27-alpine
COPY dist-e2e/ /usr/share/nginx/html/
COPY deploy/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
