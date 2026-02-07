# ==================== Build Stage ====================
FROM maven:3.9-eclipse-temurin-21 AS builder

WORKDIR /build

# Copy pom and download dependencies (layer caching)
COPY pom.xml ./

RUN mvn dependency:go-offline -DskipTests

# Copy source code
COPY src ./src

# Build application
RUN mvn clean package -DskipTests

# ==================== Runtime Stage ====================
FROM eclipse-temurin:21-jre-alpine

WORKDIR /app

# Create non-root user
RUN addgroup -g 1000 appuser && \
    adduser -D -u 1000 -G appuser appuser

# Copy built JAR from builder
COPY --from=builder /build/target/*.jar app.jar

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD curl -f http://localhost:8080/actuator/health || exit 1

# Security: Run as non-root
USER appuser

# Expose port
EXPOSE 8080

# Start application
ENTRYPOINT ["java", "-jar", "app.jar"]
