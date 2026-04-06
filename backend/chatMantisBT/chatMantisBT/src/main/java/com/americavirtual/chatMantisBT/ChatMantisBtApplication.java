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
	 * Intenta múltiples ubicaciones en orden:
	 * 1. src/.env (ubicación actual cuando corre desde el IDE)
	 * 2. chatMantisBT/chatMantisBT/.env (desde la raíz del repo)
	 * 3. ./.env (directorio de trabajo actual - ejecución desde Maven)
	 */
	private static String resolveEnvDirectory() {
		// Check src/ directory (common when running from IDE in project root)
		java.io.File srcEnv = new java.io.File("src/.env");
		if (srcEnv.exists()) {
			return "src";
		}
		
		// Check nested module structure (from repo root)
		java.io.File nestedEnv = new java.io.File("chatMantisBT/chatMantisBT/src/.env");
		if (nestedEnv.exists()) {
			return "chatMantisBT/chatMantisBT/src";
		}
		
		// Fallback to current directory
		return ".";
	}

}
