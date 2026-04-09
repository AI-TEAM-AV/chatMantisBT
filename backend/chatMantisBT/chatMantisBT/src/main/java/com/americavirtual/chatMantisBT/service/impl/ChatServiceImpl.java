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
import com.americavirtual.chatMantisBT.entity.dto.ChatSocketMessageResponse;
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

    private void broadcastMessage(Long personNumber, ChatMessage message) {
        if (messagingTemplate == null || message == null) return;
        ChatSocketMessageResponse payload = new ChatSocketMessageResponse(personNumber, message);
        messagingTemplate.convertAndSend("/topic/chats/" + personNumber + "/messages", payload);
        messagingTemplate.convertAndSend("/topic/chats/messages", payload);
    }

    private boolean isBlank(String value) {
        return value == null || value.isBlank();
    }

    private boolean hasAnyMessageContent(String content, String images, String document) {
        return !isBlank(content) || !isBlank(images) || !isBlank(document);
    }

    private boolean hasAnyAttachment(String images, String document) {
        return !isBlank(images) || !isBlank(document);
    }

    private void sendOutboundMessageToEvolution(Long personNumber, ChatMessageRequest request) {
        if (!"operator".equals(request.getSender())) {
            return;
        }

        if (!hasAnyAttachment(request.getImages(), request.getDocument())) {
            if (!isBlank(request.getContent())) {
                EvolutionApi.sendMessage(personNumber, request.getContent());
            }
            return;
        }

        String mediaType = !isBlank(request.getImages()) ? "image" : "document";
        String mediaBase64 = !isBlank(request.getImages()) ? request.getImages() : request.getDocument();
        EvolutionApi.sendMedia(
                personNumber,
                mediaType,
                mediaBase64,
                request.getFileName(),
                request.getContent(),
                request.getMimetype());
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
        pendingUser.setImages(createChatRequest.getImages());
        pendingUser.setFileName(createChatRequest.getFileName());
        pendingUser.setMimetype(createChatRequest.getMimetype());
        pendingUser.setDocument(createChatRequest.getDocument());
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

        if (!hasAnyMessageContent(request.getContent(), request.getImages(), request.getDocument())) {
            throw new IllegalArgumentException("Message content cannot be empty when no attachment is provided");
        }

        ChatMessage outboundMessage = new ChatMessage(
                request.getSender(),
                request.getContent(),
                request.getImages(),
                request.getFileName(),
                request.getMimetype(),
            request.getDocument());

        pendingUser.getMessages().add(outboundMessage);
        PendingUser updated = pendingUserRepository.save(pendingUser);

        sendOutboundMessageToEvolution(personNumber, request);

        PendingUserResponse response = new PendingUserResponse(updated);
        broadcastMessage(personNumber, outboundMessage);
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
    public void receiveWebhookMessage(
            Long personNumber,
            String name,
            String text,
            String images,
            String fileName,
            String mimetype,
            String document) {
        PendingUser pendingUser = pendingUserRepository.findById(personNumber).orElse(null);
        boolean hasMessageContent = hasAnyMessageContent(text, images, document);
        ChatMessage inboundMessage = null;
        boolean isNewConversation = pendingUser == null;

        if (pendingUser == null) {
            // New conversation: create with initial metadata
            pendingUser = new PendingUser();
            pendingUser.setPersonNumber(personNumber);
            pendingUser.setName(name);
            pendingUser.setState("waiting");
            pendingUser.setProblematic(text);
            pendingUser.setImages(images);
            pendingUser.setFileName(fileName);
            pendingUser.setMimetype(mimetype);
            pendingUser.setDocument(document);
        } else {
            // Existing conversation: only update initial metadata if blank AND it's the very first message
            // (messages array is empty). Never overwrite them on subsequent messages.
            if (pendingUser.getMessages().isEmpty()) {
                if (isBlank(pendingUser.getName()) && !isBlank(name)) {
                    pendingUser.setName(name);
                }
                if (isBlank(pendingUser.getProblematic()) && !isBlank(text)) {
                    pendingUser.setProblematic(text);
                }
                if (isBlank(pendingUser.getImages()) && !isBlank(images)) {
                    pendingUser.setImages(images);
                }
                if (isBlank(pendingUser.getFileName()) && !isBlank(fileName)) {
                    pendingUser.setFileName(fileName);
                }
                if (isBlank(pendingUser.getMimetype()) && !isBlank(mimetype)) {
                    pendingUser.setMimetype(mimetype);
                }
                if (isBlank(pendingUser.getDocument()) && !isBlank(document)) {
                    pendingUser.setDocument(document);
                }
            }
            // For subsequent messages, never modify initial metadata - only add to messages array
        }

        if (hasMessageContent) {
            inboundMessage = new ChatMessage(
                    String.valueOf(personNumber),
                    text,
                    images,
                    fileName,
                    mimetype,
                document);
            pendingUser.getMessages().add(inboundMessage);
        }

        PendingUser saved = pendingUserRepository.save(pendingUser);

        // Si la conversación no tenía mensaje textual y llega un adjunto, mantener
        // contenido visible para la lista/resumen sin perder compatibilidad existente.
        if (isBlank(saved.getProblematic()) && hasAnyAttachment(images, document)) {
            saved.setProblematic(!isBlank(images)
                    ? "Imagen adjunta"
                    : "Archivo adjunto: " + (fileName == null ? "documento" : fileName));
            saved = pendingUserRepository.save(saved);
        }

        if (hasMessageContent) {
            broadcastMessage(personNumber, inboundMessage);
        }
        broadcast(new PendingUserResponse(saved));
    }
}
