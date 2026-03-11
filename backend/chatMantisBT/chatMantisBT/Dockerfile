# 1. Construcción con Java 25
# Usamos una imagen de Maven que tenga JDK 25 (o la más cercana disponible)
FROM maven:3.9.9-eclipse-temurin-25-alpine AS build
WORKDIR /app
COPY pom.xml .
COPY src ./src
RUN mvn clean package -DskipTests

# 2. Ejecución con JRE 25
FROM eclipse-temurin:25-jre-alpine
WORKDIR /app

# Límites de memoria para Render (512MB)
ENV JAVA_OPTS="-Xmx350M -Xms350M -XX:+UseSerialGC -XX:+ExitOnOutOfMemoryError"

COPY --from=build /app/target/*.jar app.jar

ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar app.jar"]]
