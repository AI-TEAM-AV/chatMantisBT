package com.americavirtual.chatMantisBT.entity.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.databind.JsonNode;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Maps the Evolution API webhook payload.
 *
 * Example payload for an incoming message:
 * {
 *   "event": "messages.upsert",
 *   "instance": "Testing IA",
 *   "data": {
 *     "key": { "remoteJid": "5491112345678@s.whatsapp.net", "fromMe": false, "id": "..." },
 *     "pushName": "John Doe",
 *     "message": { "conversation": "Hello, I need help" },
 *     "messageType": "conversation"
 *   }
 * }
 */
@Data
@NoArgsConstructor
@JsonIgnoreProperties(ignoreUnknown = true)
public class WebhookPayload {

    private String event;
    private String instance;
    private Data data;

    @lombok.Data
    @NoArgsConstructor
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class Data {
        private Key key;
        private String pushName;
        private Message message;
        private String messageType;
        private String images;
        private String fileName;
        private String mimetype;
        private String document;
    }

    @lombok.Data
    @NoArgsConstructor
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class Key {
        private String remoteJid;
        private boolean fromMe;
        private String id;
    }

    @lombok.Data
    @NoArgsConstructor
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class Message {
        private String conversation;
        private ExtendedText extendedTextMessage;
        private JsonNode imageMessage;
        private JsonNode documentMessage;
        private JsonNode documentWithCaptionMessage;
        private String base64;
        private String mediaUrl;
        private String caption;
        private String images;
        private String fileName;
        private String mimetype;
        private String document;
    }

    @lombok.Data
    @NoArgsConstructor
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class ExtendedText {
        private String text;
    }

    /**
     * Returns the plain text of the message, checking both
     * conversation and extendedTextMessage fields.
     */
    public String extractText() {
        if (data == null || data.getMessage() == null) return null;
        Message msg = data.getMessage();
        if (msg.getConversation() != null && !msg.getConversation().isBlank()) {
            return msg.getConversation();
        }
        if (msg.getExtendedTextMessage() != null) {
            return msg.getExtendedTextMessage().getText();
        }

        if (msg.getCaption() != null && !msg.getCaption().isBlank()) {
            return msg.getCaption();
        }

        JsonNode documentWithCaption = msg.getDocumentWithCaptionMessage();
        if (documentWithCaption != null) {
            String caption = readNestedText(documentWithCaption, "message", "documentMessage", "caption");
            if (caption != null && !caption.isBlank()) {
                return caption;
            }
        }

        JsonNode imageMessage = msg.getImageMessage();
        if (imageMessage != null) {
            String caption = readText(imageMessage, "caption");
            if (caption != null && !caption.isBlank()) {
                return caption;
            }
        }

        return null;
    }

    public String extractImageBase64() {
        if (data == null) return null;

        Message msg = data.getMessage();
        if (msg != null) {
            if (isImageType(data.getMessageType())) {
                if (msg.getBase64() != null && !msg.getBase64().isBlank()) {
                    return msg.getBase64();
                }
                if (msg.getMediaUrl() != null && !msg.getMediaUrl().isBlank()) {
                    return msg.getMediaUrl();
                }
            }

            if (msg.getImages() != null && !msg.getImages().isBlank()) {
                return msg.getImages();
            }
            String fromImageMessage = readText(msg.getImageMessage(), "images", "base64", "url");
            if (fromImageMessage != null && !fromImageMessage.isBlank()) {
                return fromImageMessage;
            }
        }

        return data.getImages();
    }

    public String extractDocumentBase64() {
        if (data == null) return null;

        Message msg = data.getMessage();
        if (msg != null) {
            if (isDocumentType(data.getMessageType())) {
                if (msg.getBase64() != null && !msg.getBase64().isBlank()) {
                    return msg.getBase64();
                }
                if (msg.getMediaUrl() != null && !msg.getMediaUrl().isBlank()) {
                    return msg.getMediaUrl();
                }
            }

            if (msg.getDocument() != null && !msg.getDocument().isBlank()) {
                return msg.getDocument();
            }

            String directDocument = readText(msg.getDocumentMessage(), "document", "base64");
            if (directDocument != null && !directDocument.isBlank()) {
                return directDocument;
            }

            String directDocumentUrl = readText(msg.getDocumentMessage(), "url");
            if (directDocumentUrl != null && !directDocumentUrl.isBlank()) {
                return directDocumentUrl;
            }

            String withCaptionDocument = readNestedText(
                    msg.getDocumentWithCaptionMessage(),
                    "message", "documentMessage", "document");
            if (withCaptionDocument != null && !withCaptionDocument.isBlank()) {
                return withCaptionDocument;
            }

            String withCaptionBase64 = readNestedText(
                    msg.getDocumentWithCaptionMessage(),
                    "message", "documentMessage", "base64");
            if (withCaptionBase64 != null && !withCaptionBase64.isBlank()) {
                return withCaptionBase64;
            }

            String withCaptionUrl = readNestedText(
                    msg.getDocumentWithCaptionMessage(),
                    "message", "documentMessage", "url");
            if (withCaptionUrl != null && !withCaptionUrl.isBlank()) {
                return withCaptionUrl;
            }
        }

        return data.getDocument();
    }

    public String extractFileName() {
        if (data == null) return null;

        Message msg = data.getMessage();
        if (msg != null) {
            if (msg.getFileName() != null && !msg.getFileName().isBlank()) {
                return msg.getFileName();
            }

            String directFileName = readText(msg.getDocumentMessage(), "fileName");
            if (directFileName != null && !directFileName.isBlank()) {
                return directFileName;
            }

            String withCaptionFileName = readNestedText(
                    msg.getDocumentWithCaptionMessage(),
                    "message", "documentMessage", "fileName");
            if (withCaptionFileName != null && !withCaptionFileName.isBlank()) {
                return withCaptionFileName;
            }

            if (isImageType(data.getMessageType())) {
                return "image.jpg";
            }
        }

        return data.getFileName();
    }

    public String extractMimetype() {
        if (data == null) return null;

        Message msg = data.getMessage();
        if (msg != null) {
            if (msg.getMimetype() != null && !msg.getMimetype().isBlank()) {
                return msg.getMimetype();
            }

            String directMime = readText(msg.getDocumentMessage(), "mimetype");
            if (directMime != null && !directMime.isBlank()) {
                return directMime;
            }

            String withCaptionMime = readNestedText(
                    msg.getDocumentWithCaptionMessage(),
                    "message", "documentMessage", "mimetype");
            if (withCaptionMime != null && !withCaptionMime.isBlank()) {
                return withCaptionMime;
            }

            String imageMime = readText(msg.getImageMessage(), "mimetype");
            if (imageMime != null && !imageMime.isBlank()) {
                return imageMime;
            }

            if (isImageType(data.getMessageType())) {
                return "image/jpeg";
            }

            if (isDocumentType(data.getMessageType())) {
                return "application/octet-stream";
            }
        }

        return data.getMimetype();
    }

    private boolean isImageType(String messageType) {
        return messageType != null && messageType.toLowerCase().contains("imagemessage");
    }

    private boolean isDocumentType(String messageType) {
        return messageType != null && (
                messageType.toLowerCase().contains("documentmessage")
                        || messageType.toLowerCase().contains("documentwithcaptionmessage"));
    }

    private String readText(JsonNode node, String... candidates) {
        if (node == null || candidates == null) return null;
        for (String key : candidates) {
            if (key == null) continue;
            JsonNode value = node.get(key);
            if (value != null && !value.isNull()) {
                String text = value.asText(null);
                if (text != null) return text;
            }
        }
        return null;
    }

    private String readNestedText(JsonNode node, String... path) {
        if (node == null || path == null || path.length == 0) return null;
        JsonNode current = node;
        for (String segment : path) {
            if (segment == null || current == null) return null;
            current = current.get(segment);
        }
        return current == null || current.isNull() ? null : current.asText(null);
    }

    /**
     * Extracts the numeric phone number from a remoteJid like "5491112345678@s.whatsapp.net".
     * Returns null if the jid is a group or cannot be parsed.
     */
    public Long extractPersonNumber() {
        if (data == null || data.getKey() == null) return null;
        String jid = data.getKey().getRemoteJid();
        if (jid == null || jid.contains("-")) return null; // groups have dashes
        String number = jid.split("@")[0];
        try {
            return Long.parseLong(number);
        } catch (NumberFormatException e) {
            return null;
        }
    }
}
