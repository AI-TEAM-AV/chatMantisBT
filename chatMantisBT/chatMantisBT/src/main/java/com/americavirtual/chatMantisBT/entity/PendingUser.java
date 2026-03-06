package com.americavirtual.chatMantisBT.entity;

import java.util.ArrayList;
import java.util.List;

import org.springframework.data.annotation.Id;
import org.springframework.data.redis.core.RedisHash;

import com.americavirtual.chatMantisBT.entity.dto.PendingUserRequest;

import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

@RedisHash(value = "conv")
@Data
@AllArgsConstructor(access = AccessLevel.PRIVATE)
@EqualsAndHashCode(onlyExplicitlyIncluded = true)
public class PendingUser {
    public PendingUser() {
    }

    public PendingUser(PendingUserRequest request) {
        this.personNumber = request.getPersonNumber();
        this.name = request.getName();
        this.problematic = request.getProblematic();
    }

    @Id
    @NotBlank(message = "Person number cannot be blank")
    @NotNull(message = "Person number cannot be null")
    @EqualsAndHashCode.Include
    private Long personNumber;

    @NotBlank(message = "State cannot be blank")
    @NotNull(message = "State cannot be null")
    private String state;
    
    private String name;
    
    private String problematic;

    private List<ChatMessage> messages = new ArrayList<>();
}
