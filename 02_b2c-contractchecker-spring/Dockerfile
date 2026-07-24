# Stage 1: Build the application
FROM eclipse-temurin:21-jdk-alpine AS builder
WORKDIR /app
COPY .mvn/ .mvn/
COPY mvnw pom.xml ./
# Ensure mvnw has execute permissions
RUN chmod +x ./mvnw
# Download dependencies (this caches the layer)
RUN ./mvnw dependency:go-offline

COPY src ./src
# Build the application skipping tests (tests are run in GitHub Actions before build)
RUN ./mvnw clean package -DskipTests

# Stage 2: Create the minimal runtime image
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app

# Add a non-root user for security compliance in Kubernetes
RUN addgroup -S spring && adduser -S spring -G spring
USER spring:spring

# Copy the built jar from the builder stage
COPY --from=builder /app/target/*.jar app.jar

# Expose standard web port
EXPOSE 8080

# Run the jar with production profile and JVM container awareness
# We allocate 75% of the container memory to the JVM heap, leaving 25% for native memory and OS overhead to prevent OOMKills
ENTRYPOINT ["java", "-XX:MaxRAMPercentage=75.0", "-XX:InitialRAMPercentage=50.0", "-XX:+UseZGC", "-Dspring.profiles.active=prod", "-jar", "app.jar"]
