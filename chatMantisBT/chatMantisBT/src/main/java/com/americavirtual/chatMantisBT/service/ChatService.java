package com.americavirtual.chatMantisBT.service;

import java.util.List;

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
}
