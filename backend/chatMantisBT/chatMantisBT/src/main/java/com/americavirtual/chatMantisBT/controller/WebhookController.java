package com.americavirtual.chatMantisBT.controller;

import com.americavirtual.chatMantisBT.entity.dto.WebhookPayload;
import com.americavirtual.chatMantisBT.service.ChatService;
import com.americavirtual.chatMantisBT.service.impl.EvolutionApi;
import com.fasterxml.jackson.databind.ObjectMapper;
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

    private final ObjectMapper objectMapper = new ObjectMapper();

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
    *  - Messages with no text and no attachment content
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
        String images = payload.extractImageBase64();
        String fileName = payload.extractFileName();
        String mimetype = payload.extractMimetype();
        String document = payload.extractDocumentBase64();

        boolean imageIsUrl = images != null && (images.startsWith("http://") || images.startsWith("https://"));
        boolean documentIsUrl = document != null && (document.startsWith("http://") || document.startsWith("https://"));
        if (imageIsUrl || documentIsUrl) {
            EvolutionApi.MediaDecodeResult decoded = EvolutionApi.getBase64FromMediaMessage(
                    objectMapper.valueToTree(payload.getData()));
            if (decoded != null && decoded.base64 != null && !decoded.base64.isBlank()) {
            log.info("Webhook: media URL decoded to base64 [mediaType={}, hasFileName={}]",
                decoded.mediaType,
                decoded.fileName != null && !decoded.fileName.isBlank());
                boolean isImage = "imageMessage".equalsIgnoreCase(decoded.mediaType)
                        || "image".equalsIgnoreCase(decoded.mediaType);
                if (isImage) {
                    images = decoded.base64;
                    document = null;
                } else {
                    document = decoded.base64;
                    images = null;
                }
                if ((fileName == null || fileName.isBlank()) && decoded.fileName != null && !decoded.fileName.isBlank()) {
                    fileName = decoded.fileName;
                }
                if ((mimetype == null || mimetype.isBlank()) && decoded.mimetype != null && !decoded.mimetype.isBlank()) {
                    mimetype = decoded.mimetype;
                }
                if ((text == null || text.isBlank()) && decoded.caption != null && !decoded.caption.isBlank()) {
                    text = decoded.caption;
                }
            } else {
                log.warn("Webhook: media URL detected but Evolution base64 decode returned empty");
            }
        }

        boolean hasText = text != null && !text.isBlank();
        boolean hasImage = images != null && !images.isBlank();
        boolean hasDocument = document != null && !document.isBlank();

        if (!hasText && !hasImage && !hasDocument) {
            log.debug("Webhook: ignoring message without text/attachments from {}", personNumber);
            return ResponseEntity.ok().build();
        }

        String name = payload.getData().getPushName();
        log.info("Webhook: incoming message from {} ({}) [text={}, image={}, document={}]",
                personNumber,
                name,
                hasText,
                hasImage,
                hasDocument);

        chatService.receiveWebhookMessage(personNumber, name, text, images, fileName, mimetype, document);
        return ResponseEntity.ok().build();
    }
}
