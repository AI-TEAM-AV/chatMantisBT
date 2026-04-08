package com.americavirtual.chatMantisBT.service.impl;
import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.util.LinkedHashMap;
import java.util.Map;

import com.fasterxml.jackson.databind.JsonNode;

import com.fasterxml.jackson.databind.ObjectMapper;

public class EvolutionApi {
    private static final ObjectMapper objectMapper = new ObjectMapper();

    public static class MediaDecodeResult {
        public final String mediaType;
        public final String base64;
        public final String fileName;
        public final String mimetype;
        public final String caption;

        public MediaDecodeResult(String mediaType, String base64, String fileName, String mimetype, String caption) {
            this.mediaType = mediaType;
            this.base64 = base64;
            this.fileName = fileName;
            this.mimetype = mimetype;
            this.caption = caption;
        }
    }

    private EvolutionApi() {
    }

    private static String getBaseUrl() {
        String apiUrl = System.getProperty("EVOLUTION_API_URL");
        if (apiUrl == null || apiUrl.isBlank()) {
            throw new IllegalStateException("EVOLUTION_API_URL is not configured");
        }
        return apiUrl;
    }

    private static String getApiKey() {
        return System.getProperty("EVOLUTION_API_KEY");
    }

    private static String getInstance() {
        return System.getProperty("EVOLUTION_INSTANCE");
    }

    private static URI resolveMediaUri() {
        String apiUrl = getBaseUrl();
        if (apiUrl.contains("/sendText/")) {
            return URI.create(apiUrl.replace("/sendText/", "/sendMedia/"));
        }
        if (apiUrl.contains("/sendText")) {
            return URI.create(apiUrl.replace("/sendText", "/sendMedia"));
        }
        return URI.create(apiUrl.endsWith("/") ? apiUrl + "sendMedia" : apiUrl + "/sendMedia");
    }

    private static URI resolveChatBase64Uri() {
        String apiUrl = getBaseUrl();
        String instance = getInstance();
        String encodedInstance = URLEncoder.encode(instance == null ? "" : instance, StandardCharsets.UTF_8);

        if (apiUrl.contains("/message/")) {
            int idx = apiUrl.indexOf("/message/");
            String base = apiUrl.substring(0, idx);
            return URI.create(base + "/chat/getBase64FromMediaMessage/" + encodedInstance);
        }

        return URI.create(apiUrl.endsWith("/")
                ? apiUrl + "chat/getBase64FromMediaMessage/" + encodedInstance
                : apiUrl + "/chat/getBase64FromMediaMessage/" + encodedInstance);
    }

    private static HttpRequest.Builder baseRequest(URI uri) {
        return HttpRequest.newBuilder()
                .uri(uri)
                .header("Content-Type", "application/json")
                .header("apikey", getApiKey())
                .header("instance", getInstance());
    }

    private static void logResponse(HttpResponse<String> response) {
        System.out.println("Código de respuesta: " + response.statusCode());
        System.out.println("Respuesta: " + response.body());
    }

    private static String normalizeBase64(String value) {
        if (value == null) {
            return null;
        }
        if (value.startsWith("data:")) {
            int commaIndex = value.indexOf(',');
            if (commaIndex >= 0 && commaIndex < value.length() - 1) {
                return value.substring(commaIndex + 1);
            }
        }
        return value;
    }

    public static void sendMessage(Long personNumber, String message) {
        try {
            HttpClient client = HttpClient.newHttpClient();
            Map<String, Object> payload = new LinkedHashMap<>();
            payload.put("number", String.valueOf(personNumber));
            payload.put("text", message);
            String jsonBody = objectMapper.writeValueAsString(payload);

            HttpRequest request = baseRequest(new URI(getBaseUrl()))
                    .POST(HttpRequest.BodyPublishers.ofString(jsonBody))
                    .build();
            HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());
            logResponse(response);
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    public static void sendMedia(Long personNumber, String mediaType, String mediaBase64, String fileName, String caption,
            String mimetype) {
        try {
            HttpClient client = HttpClient.newHttpClient();

            String normalizedMediaType = "image".equalsIgnoreCase(mediaType) ? "image" : "document";
            String normalizedMediaBase64 = normalizeBase64(mediaBase64);
            String resolvedFileName = fileName;
            if ((resolvedFileName == null || resolvedFileName.isBlank()) && "image".equals(normalizedMediaType)) {
                resolvedFileName = "image";
            }
            if ((resolvedFileName == null || resolvedFileName.isBlank()) && "document".equals(normalizedMediaType)) {
                resolvedFileName = "document";
            }

            Map<String, Object> payload = new LinkedHashMap<>();
            payload.put("number", String.valueOf(personNumber));
            payload.put("mediatype", normalizedMediaType);
            payload.put("media", normalizedMediaBase64);
            payload.put("caption", caption);
            payload.put("fileName", resolvedFileName);
            payload.put("mimetype", mimetype);
            String jsonBody = objectMapper.writeValueAsString(payload);

            HttpRequest request = baseRequest(resolveMediaUri())
                    .POST(HttpRequest.BodyPublishers.ofString(jsonBody))
                    .build();

            HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());
            logResponse(response);
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    public static MediaDecodeResult getBase64FromMediaMessage(JsonNode messagePayload) {
        if (messagePayload == null || messagePayload.isNull()) {
            return null;
        }

        try {
            HttpClient client = HttpClient.newHttpClient();

            Map<String, Object> payload = new LinkedHashMap<>();
            payload.put("message", objectMapper.treeToValue(messagePayload, Object.class));
            String jsonBody = objectMapper.writeValueAsString(payload);

            HttpRequest request = baseRequest(resolveChatBase64Uri())
                    .POST(HttpRequest.BodyPublishers.ofString(jsonBody))
                    .build();

            HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() < 200 || response.statusCode() >= 300) {
                logResponse(response);
                return null;
            }

            JsonNode node = objectMapper.readTree(response.body());
            JsonNode source = node;
            if ((source.path("base64").asText(null) == null || source.path("base64").asText(null).isBlank())
                    && node.has("data") && node.get("data").isObject()) {
                source = node.get("data");
            }

            String base64 = source.path("base64").asText(null);
            if (base64 == null || base64.isBlank()) {
                return null;
            }

            return new MediaDecodeResult(
                    source.path("mediaType").asText(null),
                    base64,
                    source.path("fileName").asText(null),
                    source.path("mimetype").asText(null),
                    source.path("caption").asText(null));
        } catch (Exception e) {
            e.printStackTrace();
            return null;
        }
    }
}
