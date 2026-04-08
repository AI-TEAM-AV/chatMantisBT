package com.americavirtual.chatMantisBT.entity.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
public class ChatMessageRequest {

    @NotBlank(message = "Sender cannot be blank")
    private String sender;

    private String content;

    private String images;

    private String fileName;

    private String mimetype;

    private String document;
}
