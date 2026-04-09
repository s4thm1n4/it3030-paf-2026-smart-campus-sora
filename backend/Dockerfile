# Multi-stage build for Spring Boot backend

# Stage 1: Build with Maven
FROM eclipse-temurin:17-jdk-alpine AS build
WORKDIR /app

# Install dos2unix to fix Windows CRLF line endings in mvnw
RUN apk add --no-cache dos2unix

# Copy Maven wrapper and pom.xml first (layer caching for dependencies)
COPY mvnw mvnw
COPY .mvn .mvn
COPY pom.xml .

# Fix line endings and make mvnw executable
RUN dos2unix mvnw && chmod +x mvnw

# Download dependencies (cached layer unless pom.xml changes)
RUN ./mvnw dependency:go-offline -B

# Copy source code
COPY src src

# Build the application (skip tests for faster Docker builds)
RUN ./mvnw package -DskipTests -B

# Stage 2: Run with lightweight JRE
FROM eclipse-temurin:17-jre-alpine
WORKDIR /app

# Create uploads directory
RUN mkdir -p /app/uploads/tickets

# Copy the built JAR from Stage 1
COPY --from=build /app/target/*.jar app.jar

EXPOSE 8080

ENTRYPOINT ["java", "-jar", "app.jar"]


