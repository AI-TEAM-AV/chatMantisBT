package com.americavirtual.chatMantisBT.entity;

import java.io.Serializable;
import java.time.LocalDateTime;

import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
public class ChatMessage implements Serializable {

    private String sender;
    private String content;
    private String images;
    private String fileName;
    private String mimetype;
    private String document;
    private LocalDateTime timestamp;

    public ChatMessage(String sender, String content) {
        this.sender = sender;
        this.content = content;
        this.timestamp = LocalDateTime.now();
    }

    public ChatMessage(
            String sender,
            String content,
            String images,
            String fileName,
            String mimetype,
            String document) {
        this.sender = sender;
        this.content = content;
        this.images = images;
        this.fileName = fileName;
        this.mimetype = mimetype;
        this.document = document;
        this.timestamp = LocalDateTime.now();
    }
}
