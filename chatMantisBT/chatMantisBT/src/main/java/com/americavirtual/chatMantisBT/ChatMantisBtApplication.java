package com.americavirtual.chatMantisBT;

import io.github.cdimascio.dotenv.Dotenv;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class ChatMantisBtApplication {

	public static void main(String[] args) {
		// Cargar variables de entorno del archivo .env ANTES de iniciar Spring Boot
		Dotenv dotenv = Dotenv.configure().ignoreIfMissing().load();
		dotenv.entries().forEach(entry ->
			System.setProperty(entry.getKey(), entry.getValue())
		);
		
		SpringApplication.run(ChatMantisBtApplication.class, args);
	}

}
