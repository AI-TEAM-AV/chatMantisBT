package com.americavirtual.chatMantisBT.repository;

import java.util.Optional;

import org.springframework.data.repository.CrudRepository;
import org.springframework.stereotype.Repository;

import com.americavirtual.chatMantisBT.entity.PendingUser;

@Repository
public interface PendingUserRepository extends CrudRepository<PendingUser, Long> {
    
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
