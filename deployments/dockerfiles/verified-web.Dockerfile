FROM nginx:1.27-alpine
COPY dist-e2e/ /usr/share/nginx/html/
COPY --from=deployment nginx/storefront.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
