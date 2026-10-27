FROM nginx:1.27-alpine
COPY dist/ /usr/share/nginx/html/
COPY --from=deployment nginx/admin.conf /etc/nginx/conf.d/default.conf
EXPOSE 8080
