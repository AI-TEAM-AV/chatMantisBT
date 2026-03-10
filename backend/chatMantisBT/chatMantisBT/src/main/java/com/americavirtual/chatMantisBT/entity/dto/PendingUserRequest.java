package com.americavirtual.chatMantisBT.entity.dto;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class PendingUserRequest {
    @NotNull(message = "Person number cannot be null")
    private Long personNumber;

    @NotNull(message = "Name cannot be null")
    private String name;

    @NotNull(message = "Problem description cannot be null")
    private String problematic;
}