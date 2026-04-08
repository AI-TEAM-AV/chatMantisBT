package com.americavirtual.chatMantisBT.entity.dto;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CreateChatRequest {
    @NotNull(message = "Person number cannot be null")
    private Long personNumber;

    private String name;
    
    private String problematic;

    private String images;

    private String fileName;

    private String mimetype;

    private String document;
}
