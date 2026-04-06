package com.americavirtual.chatMantisBT.service.impl;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import java.util.stream.StreamSupport;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import com.americavirtual.chatMantisBT.entity.ChatMessage;
import com.americavirtual.chatMantisBT.entity.PendingUser;
import com.americavirtual.chatMantisBT.entity.dto.ChatMessageRequest;
import com.americavirtual.chatMantisBT.entity.dto.CreateChatRequest;
import com.americavirtual.chatMantisBT.entity.dto.PendingUserResponse;
import com.americavirtual.chatMantisBT.repository.PendingUserRepository;
import com.americavirtual.chatMantisBT.service.ChatService;

@Service
public class ChatServiceImpl implements ChatService {

    @Autowired
    private PendingUserRepository pendingUserRepository;

    @Autowired(required = false)
    private SimpMessagingTemplate messagingTemplate;

    // Notifica al frontend del estado actualizado del chat
    private void broadcast(PendingUserResponse response) {
        if (messagingTemplate == null) return;
        messagingTemplate.convertAndSend("/topic/chats/" + response.getPersonNumber(), response);
        messagingTemplate.convertAndSend("/topic/chats", response);
    }

    // Notifica al frontend que un chat fue cerrado
    private void broadcastClosed(Long personNumber) {
        if (messagingTemplate == null) return;
        Object payload = Map.of("personNumber", personNumber, "state", "closed");
        messagingTemplate.convertAndSend("/topic/chats/" + personNumber, payload);
        messagingTemplate.convertAndSend("/topic/chats", payload);
    }

    @Override
    public List<PendingUserResponse> getWaitingUsers() {
        return pendingUserRepository.findWaitingUsers()
                .stream()
                .map(PendingUserResponse::new)
                .collect(Collectors.toList());
    }

    @Override
    public PendingUserResponse startChat(Long personNumber) {
        // Verificar que el usuario existe
        PendingUser pendingUser = pendingUserRepository.findById(personNumber)
                .orElseThrow(() -> new IllegalArgumentException(
                        "Pending user not found with person number: " + personNumber));

        // Actualizar estado a "operator"
        pendingUser.setState("operator");
        PendingUser updatedUser = pendingUserRepository.save(pendingUser);
        EvolutionApi.sendMessage(personNumber, "👨‍💻 ¡Un operador se ha unido al chat!");

        PendingUserResponse response = new PendingUserResponse(updatedUser);
        broadcast(response);
        return response;
    }

    @Override
    public void closeChat(Long personNumber) {
        // Verificar que el usuario existe
        if (!pendingUserRepository.existsById(personNumber)) {
            throw new IllegalArgumentException(
                    "Pending user not found with person number: " + personNumber);
        }

        // Eliminar el usuario pendiente
        pendingUserRepository.deleteById(personNumber);

        // EvolutionApi.sendMessage(personNumber, "👨‍💻 ¡El chat ha sido cerrado!");
        broadcastClosed(personNumber);
    }

    @Override
    public PendingUserResponse createChat(CreateChatRequest createChatRequest) {
        // Verificar que no exista ya un usuario con ese número
        if (pendingUserRepository.existsById(createChatRequest.getPersonNumber())) {
            throw new IllegalArgumentException(
                    "Chat already exists for person number: " + createChatRequest.getPersonNumber());
        }

        // Crear nuevo PendingUser con estado "operator"
        PendingUser pendingUser = new PendingUser();
        pendingUser.setPersonNumber(createChatRequest.getPersonNumber());
        pendingUser.setName(createChatRequest.getName());
        pendingUser.setProblematic(createChatRequest.getProblematic());
        pendingUser.setState("operator");

        PendingUser savedUser = pendingUserRepository.save(pendingUser);
        EvolutionApi.sendMessage(createChatRequest.getPersonNumber(), "👨‍💻 ¡Un operador se ha unido al chat!");

        PendingUserResponse response = new PendingUserResponse(savedUser);
        broadcast(response);
        return response;
    }

    @Override
    public PendingUserResponse sendMessage(Long personNumber, ChatMessageRequest request) {
        PendingUser pendingUser = pendingUserRepository.findById(personNumber)
                .orElseThrow(() -> new IllegalArgumentException(
                        "Pending user not found with person number: " + personNumber));

        pendingUser.getMessages().add(new ChatMessage(request.getSender(), request.getContent()));
        PendingUser updated = pendingUserRepository.save(pendingUser);

        // Enviar mensaje a Evolution API si es operador
        if(request.getSender().equals("operator")) {
            EvolutionApi.sendMessage(personNumber, request.getContent());
        }

        PendingUserResponse response = new PendingUserResponse(updated);
        broadcast(response);
        return response;
    }

    @Override
    public List<PendingUserResponse> getAllChats() {
        return StreamSupport.stream(pendingUserRepository.findAll().spliterator(), false)
                .map(PendingUserResponse::new)
                .collect(Collectors.toList());
    }

    @Override
    public PendingUserResponse getChatByPersonNumber(Long personNumber) {
        PendingUser pendingUser = pendingUserRepository.findById(personNumber)
                .orElseThrow(() -> new IllegalArgumentException(
                        "Chat not found with person number: " + personNumber));
        return new PendingUserResponse(pendingUser);
    }

    @Override
    public void receiveWebhookMessage(Long personNumber, String name, String text) {
        PendingUser pendingUser = pendingUserRepository.findById(personNumber).orElse(null);
        if (pendingUser != null) {
            pendingUser.getMessages().add(new ChatMessage(String.valueOf(personNumber), text));
            PendingUser saved = pendingUserRepository.save(pendingUser);
            broadcast(new PendingUserResponse(saved));
        }
    }
}
