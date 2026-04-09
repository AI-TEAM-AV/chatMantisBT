package com.americavirtual.chatMantisBT.entity.dto;

import com.americavirtual.chatMantisBT.entity.ChatMessage;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ChatSocketMessageResponse {

    private Long personNumber;
    private String sender;
    private String content;
    private String images;
    private String fileName;
    private String mimetype;
    private String document;
    private String timestamp;

    public ChatSocketMessageResponse(Long personNumber, ChatMessage message) {
        this.personNumber = personNumber;
        this.sender = message.getSender();
        this.content = message.getContent();
        this.images = message.getImages();
        this.fileName = message.getFileName();
        this.mimetype = message.getMimetype();
        this.document = message.getDocument();
        this.timestamp = message.getTimestamp() == null ? null : message.getTimestamp().toString();
    }
}
