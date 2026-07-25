# ==============================================================================
# Multi-Stage Monorepo Dockerfile for GKE / GTC Deployments
# Targets: frontend, backend, aigateway, opscontrol
# ==============================================================================

# ==========================================
# TARGET 1: FRONTEND (B2C React App)
# ==========================================
FROM node:20-alpine AS frontend-builder
WORKDIR /app
COPY 01_kundenbereich-b2c/package.json 01_kundenbereich-b2c/package-lock.json* ./
RUN npm ci
COPY 01_kundenbereich-b2c/ .
RUN npm run build

FROM nginxinc/nginx-unprivileged:alpine AS frontend
COPY 01_kundenbereich-b2c/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=frontend-builder --chown=nginx:nginx /app/dist /usr/share/nginx/html
EXPOSE 8080
CMD ["nginx", "-g", "daemon off;"]


# ==========================================
# TARGET 2: BACKEND (Java Spring Boot)
# ==========================================
FROM eclipse-temurin:21-jdk-alpine AS backend-builder
WORKDIR /app
COPY 02_b2c-contractchecker-spring/.mvn/ .mvn/
COPY 02_b2c-contractchecker-spring/mvnw 02_b2c-contractchecker-spring/pom.xml ./
RUN chmod +x ./mvnw
RUN ./mvnw dependency:go-offline
COPY 02_b2c-contractchecker-spring/src ./src
RUN ./mvnw clean package -DskipTests

FROM eclipse-temurin:21-jre-alpine AS backend
WORKDIR /app
RUN addgroup -S spring && adduser -S spring -G spring
USER spring:spring
COPY --from=backend-builder /app/target/*.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-XX:MaxRAMPercentage=75.0", "-XX:InitialRAMPercentage=50.0", "-XX:+UseZGC", "-Dspring.profiles.active=prod", "-jar", "app.jar"]


# ==========================================
# TARGET 3: AI GATEWAY (Python FastAPI)
# ==========================================
FROM python:3.11-slim AS aigateway
RUN addgroup --system appuser && adduser --system --group appuser
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*
COPY 03_b2c-ai-gateway/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY 03_b2c-ai-gateway/src/ ./src/
RUN chown -R appuser:appuser /app
USER appuser
EXPOSE 8000
ENV PYTHONPATH=/app/src
CMD ["uvicorn", "src.main:app", "--host", "0.0.0.0", "--port", "8000"]


# ==========================================
# TARGET 4: OPS CONTROL CENTER (Static PWA)
# ==========================================
FROM nginxinc/nginx-unprivileged:alpine AS opscontrol
COPY 04_ops-control-center/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=frontend-builder --chown=nginx:nginx /app/04_ops-control-center /usr/share/nginx/html
# Fallback build copy if frontend-builder context is not used directly
COPY --chown=nginx:nginx 04_ops-control-center/ /usr/share/nginx/html
EXPOSE 8080
CMD ["nginx", "-g", "daemon off;"]
