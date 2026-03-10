package com.americavirtual.chatMantisBT;

import io.github.cdimascio.dotenv.Dotenv;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class ChatMantisBtApplication {

	public static void main(String[] args) {
		// Cargar variables de entorno del archivo .env ANTES de iniciar Spring Boot.
		// Se busca en múltiples ubicaciones para cubrir distintos directorios de ejecución.
		Dotenv dotenv = Dotenv.configure()
				.directory(resolveEnvDirectory())
				.ignoreIfMissing()
				.load();
		dotenv.entries().forEach(entry ->
			System.setProperty(entry.getKey(), entry.getValue())
		);

		SpringApplication.run(ChatMantisBtApplication.class, args);
	}

	/**
	 * Resuelve el directorio donde se encuentra el .env.
	 * Cuando la app se ejecuta desde la raíz del repo (comportamiento del IDE),
	 * el .env está en chatMantisBT/chatMantisBT/.
	 * Cuando se ejecuta desde dentro del módulo Maven, está en el directorio actual.
	 */
	private static String resolveEnvDirectory() {
		java.io.File fromRoot = new java.io.File("chatMantisBT/chatMantisBT/.env");
		if (fromRoot.exists()) {
			return "chatMantisBT/chatMantisBT";
		}
		return "."; // directorio de trabajo actual (ejecución desde dentro del módulo)
	}

}
