package com.americavirtual.chatMantisBT.entity.dto;

import com.americavirtual.chatMantisBT.entity.PendingUser;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class PendingUserResponse {
    private Long personNumber;
    private String state;
    private String name;
    private String problematic;

    public PendingUserResponse(PendingUser pendingUser) {
        this.personNumber = pendingUser.getPersonNumber();
        this.state = pendingUser.getState();
        this.name = pendingUser.getName();
        this.problematic = pendingUser.getProblematic();
    }
}
