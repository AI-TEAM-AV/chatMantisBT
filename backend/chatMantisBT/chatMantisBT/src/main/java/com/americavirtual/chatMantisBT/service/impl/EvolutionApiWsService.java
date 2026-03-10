package com.americavirtual.chatMantisBT.service.impl;

import com.americavirtual.chatMantisBT.entity.dto.WebhookPayload;
import com.americavirtual.chatMantisBT.service.ChatService;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.annotation.PreDestroy;
import org.java_websocket.client.WebSocketClient;
import org.java_websocket.drafts.Draft_6455;
import org.java_websocket.handshake.ServerHandshake;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;

/**
 * Connects to the EvolutionAPI WebSocket server to receive WhatsApp events
 * in real-time (as an alternative/complement to the HTTP webhook).
 *
 * Required env var:
 *   EVOLUTION_API_WS_URL  – e.g. wss://your-host/ws/Your%20Instance
 *
 * On receiving a "messages.upsert" event, delegates to ChatService just like
 * the WebhookController does.
 */
@Service
public class EvolutionApiWsService {

    private static final Logger log = LoggerFactory.getLogger(EvolutionApiWsService.class);

    @Autowired
    private ChatService chatService;

    private final ObjectMapper objectMapper = new ObjectMapper();
    private volatile WebSocketClient wsClient;
    private final ScheduledExecutorService scheduler = Executors.newSingleThreadScheduledExecutor();
    private volatile boolean running = true;

    @EventListener(ApplicationReadyEvent.class)
    public void connect() {
        String wsUrl  = System.getProperty("EVOLUTION_API_WS_URL");
        String apiKey = System.getProperty("EVOLUTION_API_KEY");

        if (wsUrl == null || wsUrl.isBlank()) {
            log.warn("EVOLUTION_API_WS_URL not set – EvolutionAPI WebSocket connection skipped");
            return;
        }

        try {
            Map<String, String> headers = new HashMap<>();
            headers.put("apikey", apiKey);

            wsClient = new WebSocketClient(new URI(wsUrl), new Draft_6455(), headers, 30_000) {

                @Override
                public void onOpen(ServerHandshake handshake) {
                    log.info("Connected to EvolutionAPI WebSocket at {}", wsUrl);
                }

                @Override
                public void onMessage(String message) {
                    handleMessage(message);
                }

                @Override
                public void onClose(int code, String reason, boolean remote) {
                    log.warn("EvolutionAPI WebSocket closed: code={}, reason={}, remote={}", code, reason, remote);
                    if (running) {
                        scheduleReconnect();
                    }
                }

                @Override
                public void onError(Exception ex) {
                    log.error("EvolutionAPI WebSocket error: {}", ex.getMessage());
                }
            };

            wsClient.connect();

        } catch (Exception e) {
            log.error("Failed to connect to EvolutionAPI WebSocket", e);
            scheduleReconnect();
        }
    }

    private void handleMessage(String raw) {
        try {
            WebhookPayload payload = objectMapper.readValue(raw, WebhookPayload.class);

            if (!"messages.upsert".equals(payload.getEvent())) return;
            if (payload.getData() == null || payload.getData().getKey() == null) return;
            if (payload.getData().getKey().isFromMe()) return;

            Long personNumber = payload.extractPersonNumber();
            if (personNumber == null) {
                log.warn("WS: could not extract personNumber from remoteJid '{}'",
                        payload.getData().getKey().getRemoteJid());
                return;
            }

            String text = payload.extractText();
            if (text == null || text.isBlank()) {
                log.debug("WS: ignoring non-text message from {}", personNumber);
                return;
            }

            String name = payload.getData().getPushName();
            chatService.receiveWebhookMessage(personNumber, name, text);
            log.debug("WS: processed message from {} ({})", personNumber, name);

        } catch (Exception e) {
            log.error("Error processing EvolutionAPI WebSocket message", e);
        }
    }

    private void scheduleReconnect() {
        scheduler.schedule(() -> {
            if (running) {
                log.info("Reconnecting to EvolutionAPI WebSocket...");
                connect();
            }
        }, 5, TimeUnit.SECONDS);
    }

    @PreDestroy
    public void disconnect() {
        running = false;
        if (wsClient != null && wsClient.isOpen()) {
            wsClient.close();
        }
        scheduler.shutdownNow();
    }
}
