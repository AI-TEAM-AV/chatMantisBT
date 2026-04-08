package com.americavirtual.chatMantisBT.service.impl;

import com.americavirtual.chatMantisBT.entity.dto.WebhookPayload;
import com.americavirtual.chatMantisBT.service.ChatService;
import com.fasterxml.jackson.databind.ObjectMapper;
import io.socket.client.IO;
import io.socket.client.Socket;
import jakarta.annotation.PreDestroy;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.util.Arrays;
import java.util.List;
import java.util.Map;

/**
 * Connects to EvolutionAPI via Socket.IO to receive WhatsApp events in real-time.
 *
 * Required env var:
 *   EVOLUTION_API_WS_URL  – base HTTP(S) URL, e.g. https://your-host
 *   EVOLUTION_API_KEY     – API key for authentication
 */
@Service
public class EvolutionApiWsService {

    private static final Logger log = LoggerFactory.getLogger(EvolutionApiWsService.class);

    @Autowired
    private ChatService chatService;

    private final ObjectMapper objectMapper = new ObjectMapper();
    private volatile Socket socket;

    @EventListener(ApplicationReadyEvent.class)
    public void connect() {
        String wsUrl  = System.getProperty("EVOLUTION_API_WS_URL");
        String apiKey = System.getProperty("EVOLUTION_API_KEY");

        if (wsUrl == null || wsUrl.isBlank()) {
            log.warn("EVOLUTION_API_WS_URL not set – EvolutionAPI Socket.IO connection skipped");
            return;
        }

        // socket.io-client requires http/https scheme, not ws/wss
        String normalizedUrl = wsUrl
                .replaceFirst("^wss://", "https://")
                .replaceFirst("^ws://",  "http://")
                // strip any trailing slash so path concatenation is clean
                .replaceFirst("/+$", "");

        // Optional: override the Socket.IO mount path (default: /socket.io)
        String wsPath = System.getProperty("EVOLUTION_API_WS_PATH", "/socket.io");

        log.info("Connecting to EvolutionAPI Socket.IO – base: {} | path: {}", normalizedUrl, wsPath);

        try {
            IO.Options opts = IO.Options.builder()
                    .setTransports(new String[]{"websocket"})
                    .setPath(wsPath)
                    .setReconnection(true)
                    .setReconnectionDelay(5000)
                    .build();
            // EvolutionAPI v2: auth via Socket.IO auth map AND HTTP header for fallback
            opts.auth = Map.of("apikey", apiKey);
            opts.extraHeaders = Map.of("apikey", List.of(apiKey));

            socket = IO.socket(URI.create(normalizedUrl), opts);

            socket.on(Socket.EVENT_CONNECT, args ->
                    log.info("Connected to EvolutionAPI Socket.IO at {}", normalizedUrl));

            socket.on(Socket.EVENT_DISCONNECT, args ->
                    log.warn("Disconnected from EvolutionAPI Socket.IO: {}", Arrays.toString(args)));

            socket.on(Socket.EVENT_CONNECT_ERROR, args -> {
                if (args.length > 0 && args[0] instanceof Throwable t) {
                    log.error("EvolutionAPI Socket.IO connection error: {} – cause: {}",
                            t.getMessage(), t.getCause() != null ? t.getCause().getMessage() : "n/a");
                } else {
                    log.error("EvolutionAPI Socket.IO connection error: {}", Arrays.toString(args));
                }
            });

            socket.on("messages.upsert", args -> {
                if (args.length > 0) handleMessage(args[0].toString());
            });

            socket.connect();

        } catch (Exception e) {
            log.error("Failed to connect to EvolutionAPI Socket.IO at {}", normalizedUrl, e);
        }
    }

    private void handleMessage(String raw) {
        try {
            WebhookPayload payload = objectMapper.readValue(raw, WebhookPayload.class);

            if (payload.getData() == null || payload.getData().getKey() == null) return;
            if (payload.getData().getKey().isFromMe()) return;

            Long personNumber = payload.extractPersonNumber();
            if (personNumber == null) {
                log.warn("WS: could not extract personNumber from remoteJid '{}'",
                        payload.getData().getKey().getRemoteJid());
                return;
            }

            String text = payload.extractText();
            String images = payload.extractImageBase64();
            String fileName = payload.extractFileName();
            String mimetype = payload.extractMimetype();
            String document = payload.extractDocumentBase64();

            boolean hasText = text != null && !text.isBlank();
            boolean hasImage = images != null && !images.isBlank();
            boolean hasDocument = document != null && !document.isBlank();

            if (!hasText && !hasImage && !hasDocument) {
                log.debug("WS: ignoring message without text/attachments from {}", personNumber);
                return;
            }

            String name = payload.getData().getPushName();
            chatService.receiveWebhookMessage(
                    personNumber,
                    name,
                    text,
                    images,
                    fileName,
                    mimetype,
                    document);
            log.debug(
                    "WS: processed message from {} ({}) [text={}, image={}, document={}]",
                    personNumber,
                    name,
                    hasText,
                    hasImage,
                    hasDocument);

        } catch (Exception e) {
            log.error("Error processing EvolutionAPI Socket.IO message", e);
        }
    }

    @PreDestroy
    public void disconnect() {
        if (socket != null) {
            socket.disconnect();
            socket.close();
        }
    }
}
