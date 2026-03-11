# 1. Construcción (Maven)
FROM maven:3.9.6-eclipse-temurin-17-alpine AS build
WORKDIR /app
COPY pom.xml .
COPY src ./src
RUN mvn clean package -DskipTests

# 2. Ejecución (Runtime)
FROM eclipse-temurin:17-jre-alpine
WORKDIR /app
# Límites de memoria para que Render no explote
ENV JAVA_OPTS="-Xmx350M -Xms350M -XX:+UseSerialGC -XX:+ExitOnOutOfMemoryError"
COPY --from=build /app/target/*.jar app.jar
ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar app.jar"]
