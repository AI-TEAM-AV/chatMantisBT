package com.americavirtual.chatMantisBT.service.impl;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;

public class EvolutionApi {
    public static void sendMessage ( Long personNumber, String message ) {
        try {
            String apiUrl      = System.getProperty("EVOLUTION_API_URL");
            String apiKey      = System.getProperty("EVOLUTION_API_KEY");
            String apiInstance = System.getProperty("EVOLUTION_INSTANCE");

            // Cliente HTTP
            HttpClient client = HttpClient.newHttpClient();

            // JSON del cuerpo
            String jsonBody = "{"
                    + "\"number\":\"" + personNumber + "\","
                    + "\"text\":\"" + message + "\""
                    + "}";

            // Construcción del request
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(new URI(apiUrl))
                    .header("Content-Type", "application/json")
                    .header("apikey", apiKey)
                    .header("instance", apiInstance)
                    .POST(HttpRequest.BodyPublishers.ofString(jsonBody))
                    .build();

            // Enviar y recibir respuesta
            HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());

            System.out.println("Código de respuesta: " + response.statusCode());
            System.out.println("Respuesta: " + response.body());

        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}
