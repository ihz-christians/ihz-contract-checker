# Secure, unprivileged Nginx for static Ops Control Center PWA
FROM nginxinc/nginx-unprivileged:alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --chown=nginx:nginx . /usr/share/nginx/html
EXPOSE 8080
CMD ["nginx", "-g", "daemon off;"]