# 1. Etapa de Construcción
FROM maven:3.9.6-eclipse-temurin-21 AS build
WORKDIR /app
COPY pom.xml .
COPY src ./src
RUN mvn clean package -DskipTests

# 2. Etapa de Ejecución
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app

# Límites de memoria para Render (512MB)
ENV JAVA_OPTS="-Xmx350M -Xms350M -XX:+UseSerialGC -XX:+ExitOnOutOfMemoryError"

COPY --from=build /app/target/*.jar app.jar

ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar app.jar"]
