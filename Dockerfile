# ==============================================================================
# Multi-Stage Monorepo Dockerfile for GKE / GTC Deployments
# Targets: backend, aigateway, opscontrol
# ==============================================================================

# ==========================================
# TARGET 1: BACKEND (Java Spring Boot)
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

# Copy uv binary from the official Astral image for blazingly fast package installations
COPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /bin/

RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*
COPY 03_b2c-ai-gateway/pyproject.toml 03_b2c-ai-gateway/uv.lock ./
RUN uv pip install --system --no-cache .
COPY 03_b2c-ai-gateway/src/ ./src/
RUN chown -R appuser:appuser /app
USER appuser
EXPOSE 8000
ENV PYTHONPATH=/app/src
CMD ["uvicorn", "src.main:app", "--host", "0.0.0.0", "--port", "8000"]


# ==========================================
# TARGET 3: OPS CONTROL CENTER (Static PWA)
# ==========================================
FROM caddy:2-alpine AS opscontrol
COPY 04_ops-control-center/Caddyfile /etc/caddy/Caddyfile
COPY 04_ops-control-center/ /usr/share/caddy/
EXPOSE 8080
CMD ["caddy", "run", "--config", "/etc/caddy/Caddyfile", "--adapter", "caddyfile"]
