package com.americavirtual.chatMantisBT.controller;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.americavirtual.chatMantisBT.entity.dto.ChatMessageRequest;
import com.americavirtual.chatMantisBT.entity.dto.CreateChatRequest;
import com.americavirtual.chatMantisBT.entity.dto.PendingUserResponse;
import com.americavirtual.chatMantisBT.service.ChatService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/v1/chats")
public class ChatController {

    @Autowired
    private ChatService chatService;

    /**
     * Obtiene todos los chats sin importar su estado
     * GET /api/v1/chats
     */
    @GetMapping
    public ResponseEntity<List<PendingUserResponse>> getAllChats() {
        List<PendingUserResponse> chats = chatService.getAllChats();
        return ResponseEntity.ok(chats);
    }

    /**
     * Obtiene un chat específico por número de persona
     * GET /api/v1/chats/{personNumber}
     */
    @GetMapping("/{personNumber}")
    public ResponseEntity<PendingUserResponse> getChatByPersonNumber(@PathVariable Long personNumber) {
        PendingUserResponse response = chatService.getChatByPersonNumber(personNumber);
        return ResponseEntity.ok(response);
    }

    /**
     * Obtiene todos los usuarios pendientes con estado "waiting"
     * GET /api/v1/chats/waiting
     */
    @GetMapping("/waiting")
    public ResponseEntity<List<PendingUserResponse>> getWaitingUsers() {
        List<PendingUserResponse> waitingUsers = chatService.getWaitingUsers();
        return ResponseEntity.ok(waitingUsers);
    }

    /**
     * Inicia un chat cambiando el estado del usuario pendiente a "operator"
     * PATCH /api/chats/{personNumber}/start
     */
    @PostMapping("/{personNumber}/start")
    public ResponseEntity<PendingUserResponse> startChat(@PathVariable Long personNumber) {
        PendingUserResponse response = chatService.startChat(personNumber);
        return ResponseEntity.ok(response);
    }

    /**
     * Cierra un chat eliminando el usuario pendiente de la base
     * DELETE /api/chats/{personNumber}
     */
    @DeleteMapping("/{personNumber}")
    public ResponseEntity<Void> closeChat(@PathVariable Long personNumber) {
        chatService.closeChat(personNumber);
        return ResponseEntity.noContent().build();
    }

    /**
     * Crea un nuevo chat en base a un número con estado "operator"
     * POST /api/chats
     */
    @PostMapping
    public ResponseEntity<PendingUserResponse> createChat(@Valid @RequestBody CreateChatRequest createChatRequest) {
        PendingUserResponse response = chatService.createChat(createChatRequest);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    /**
     * Agrega un mensaje al historial de mensajes de un chat activo.
     * POST /api/v1/chats/{personNumber}/messages
     */
    @PostMapping("/{personNumber}/messages")
    public ResponseEntity<PendingUserResponse> sendMessage(
            @PathVariable Long personNumber,
            @Valid @RequestBody ChatMessageRequest request) {
        PendingUserResponse response = chatService.sendMessage(personNumber, request);
        return ResponseEntity.ok(response);
    }
}
