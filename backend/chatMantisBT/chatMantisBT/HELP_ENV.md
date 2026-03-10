# Instrucciones para usar variables de entorno en Spring Boot

1. Instala la dependencia dotenv en tu pom.xml:

<dependency>
    <groupId>io.github.cdimascio</groupId>
    <artifactId>dotenv-java</artifactId>
    <version>3.0.0</version>
</dependency>

2. Asegúrate de que el archivo .env esté en la raíz del proyecto.

3. Spring Boot ya puede leer variables de entorno si las exportas antes de ejecutar la app.

4. Para cargar automáticamente el .env, puedes agregar una clase de configuración:

import io.github.cdimascio.dotenv.Dotenv;

@Configuration
public class DotenvConfig {
    @PostConstruct
    public void loadEnv() {
        Dotenv dotenv = Dotenv.configure().ignoreIfMissing().load();
        dotenv.entries().forEach(entry ->
            System.setProperty(entry.getKey(), entry.getValue())
        );
    }
}

Esto hará que las variables estén disponibles para Spring.

5. Elimina las credenciales del application.properties (ya realizado).

6. Ejecuta tu aplicación normalmente.

