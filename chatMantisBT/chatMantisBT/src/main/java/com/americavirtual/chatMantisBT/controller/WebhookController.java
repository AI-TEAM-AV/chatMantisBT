package com.americavirtual.chatMantisBT.controller;

import com.americavirtual.chatMantisBT.entity.dto.WebhookPayload;
import com.americavirtual.chatMantisBT.service.ChatService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/webhook")
public class WebhookController {

    private static final Logger log = LoggerFactory.getLogger(WebhookController.class);

    @Autowired
    private ChatService chatService;

    /**
     * POST /api/v1/webhook
     *
     * Receives incoming WhatsApp messages from Evolution API and stores them in Redis.
     * Must be configured as the webhook URL in the Evolution API instance settings.
     *
     * Ignored events:
     *  - Any event other than "messages.upsert"
     *  - Messages sent by the bot itself (fromMe: true)
     *  - Group messages (remoteJid contains "-")
     *  - Messages with no text content
     */
    @PostMapping
    public ResponseEntity<Void> receive(@RequestBody WebhookPayload payload) {
        if (!"messages.upsert".equals(payload.getEvent())) {
            return ResponseEntity.ok().build();
        }

        if (payload.getData() == null || payload.getData().getKey() == null) {
            return ResponseEntity.ok().build();
        }

        if (payload.getData().getKey().isFromMe()) {
            return ResponseEntity.ok().build();
        }

        Long personNumber = payload.extractPersonNumber();
        if (personNumber == null) {
            log.warn("Webhook: could not extract personNumber from remoteJid '{}'",
                    payload.getData().getKey().getRemoteJid());
            return ResponseEntity.ok().build();
        }

        String text = payload.extractText();
        if (text == null || text.isBlank()) {
            log.debug("Webhook: ignoring non-text message from {}", personNumber);
            return ResponseEntity.ok().build();
        }

        String name = payload.getData().getPushName();
        log.info("Webhook: incoming message from {} ({}): {}", personNumber, name, text);

        chatService.receiveWebhookMessage(personNumber, name, text);
        return ResponseEntity.ok().build();
    }
}
