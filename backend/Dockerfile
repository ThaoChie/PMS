# Build stage
FROM maven:3.9.6-eclipse-temurin-17 AS build
WORKDIR /app

COPY pom.xml .
# Pre-fetch dependencies if possible, continue if offline plugin warning
RUN mvn dependency:resolve -B || true

COPY src ./src
RUN mvn clean package -DskipTests

# Runtime stage
FROM eclipse-temurin:17-jre
WORKDIR /app

# Ensure JVM conforms to container memory constraints (critical for Render Free Tier 512MB)
# -XX:TieredStopAtLevel=1 and -Dspring.jmx.enabled=false speed up Spring Boot cold start on throttled 0.1 CPU
ENV JAVA_OPTS="-XX:+UseContainerSupport -XX:MaxRAMPercentage=75.0 -XX:+UseSerialGC -Xss512k -XX:CICompilerCount=2 -XX:TieredStopAtLevel=1 -Dspring.jmx.enabled=false -Djava.security.egd=file:/dev/./urandom"

COPY --from=build /app/target/*.jar app.jar

EXPOSE 8080

ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar app.jar"]
