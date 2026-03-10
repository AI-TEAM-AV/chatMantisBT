package com.americavirtual.chatMantisBT.entity.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
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
        return null;
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
