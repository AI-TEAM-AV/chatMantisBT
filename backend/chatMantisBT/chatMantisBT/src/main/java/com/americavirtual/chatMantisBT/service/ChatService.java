package com.americavirtual.chatMantisBT.service;

import java.util.List;

import com.americavirtual.chatMantisBT.entity.dto.ChatMessageRequest;
import com.americavirtual.chatMantisBT.entity.dto.CreateChatRequest;
import com.americavirtual.chatMantisBT.entity.dto.PendingUserResponse;

public interface ChatService {
    
    /**
     * Obtiene todos los usuarios pendientes con estado "waiting"
     * @return lista de usuarios en espera
     */
    List<PendingUserResponse> getWaitingUsers();
    
    /**
     * Inicia un chat cambiando el estado del usuario pendiente a "operator"
     * @param personNumber el número de persona
     * @return el usuario actualizado
     */
    PendingUserResponse startChat(Long personNumber);
    
    /**
     * Cierra un chat eliminando el usuario pendiente de la base
     * @param personNumber el número de persona a eliminar
     */
    void closeChat(Long personNumber);
    
    /**
     * Crea un nuevo chat en base a un número con estado "operator"
     * @param createChatRequest datos del chat a crear
     * @return el chat creado
     */
    PendingUserResponse createChat(CreateChatRequest createChatRequest);

    /**
     * Agrega un mensaje a la lista de mensajes del chat activo.
     * @param personNumber identificador de la sesión
     * @param request datos del mensaje (sender + content)
     * @return el chat actualizado con todos sus mensajes
     */
    PendingUserResponse sendMessage(Long personNumber, ChatMessageRequest request);

    /**
     * Obtiene todos los chats sin importar su estado.
     * @return lista de todos los chats
     */
    List<PendingUserResponse> getAllChats();

    /**
     * Obtiene un chat específico por número de persona.
     * @param personNumber identificador de la sesión
     * @return el chat encontrado
     */
    PendingUserResponse getChatByPersonNumber(Long personNumber);

    /**
     * Procesa un mensaje entrante recibido desde Evolution API via webhook.
     * Si no existe un chat para el personNumber, lo crea con estado "waiting".
     * Luego agrega el mensaje a la lista de mensajes del chat.
     *
     * @param personNumber número de WhatsApp del usuario
     * @param name         nombre del contacto (pushName)
     * @param text         contenido del mensaje
     * @param images       imagen en base64 (opcional)
     * @param fileName     nombre de archivo (opcional)
     * @param mimetype     tipo MIME del archivo (opcional)
     * @param document     documento en base64 (opcional)
     */
    void receiveWebhookMessage(
            Long personNumber,
            String name,
            String text,
            String images,
            String fileName,
            String mimetype,
            String document);
}
