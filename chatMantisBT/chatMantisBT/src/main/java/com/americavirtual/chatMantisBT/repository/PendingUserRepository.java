package com.americavirtual.chatMantisBT.repository;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;
import java.util.stream.StreamSupport;

import org.springframework.data.repository.CrudRepository;
import org.springframework.stereotype.Repository;

import com.americavirtual.chatMantisBT.entity.PendingUser;

@Repository
public interface PendingUserRepository extends CrudRepository<PendingUser, Long> {
    
    /**
     * Busca todos los usuarios pendientes con un estado específico
     * @param state el estado a buscar ("waiting" o "operator")
     * @return lista de usuarios con el estado especificado
     */
    default List<PendingUser> findByState(String state) {
        return StreamSupport.stream(findAll().spliterator(), false)
                .filter(user -> state.equals(user.getState()))
                .collect(Collectors.toList());
    }
    
    /**
     * Busca todos los usuarios en estado "waiting"
     * @return lista de usuarios en espera
     */
    default List<PendingUser> findWaitingUsers() {
        return findByState("waiting");
    }
    
    /**
     * Busca todos los usuarios en estado "operator"
     * @return lista de usuarios siendo atendidos por operador
     */
    default List<PendingUser> findOperatorUsers() {
        return findByState("operator");
    }
    
    /**
     * Actualiza el state de un PendingUser a "operator"
     * Implementación por defecto usando findById + save
     * @param personNumber el número de persona
     * @return Optional con el usuario actualizado, vacío si no existe
     */
    default Optional<PendingUser> updateStateToOperator(Long personNumber) {
        Optional<PendingUser> userOpt = findById(personNumber);
        if (userOpt.isPresent()) {
            PendingUser user = userOpt.get();
            user.setState("operator");
            return Optional.of(save(user));
        }
        return Optional.empty();
    }
    
    /**
     * Crea un nuevo PendingUser con state "operator"
     * @param personNumber el número de persona
     * @param name el nombre del usuario
     * @param problematic la problemática
     * @return el usuario creado con state "operator"
     */
    default PendingUser createWithOperatorState(Long personNumber, String name, String problematic) {
        PendingUser pendingUser = new PendingUser();
        pendingUser.setPersonNumber(personNumber);
        pendingUser.setName(name);
        pendingUser.setProblematic(problematic);
        pendingUser.setState("operator");
        return save(pendingUser);
    }
}
