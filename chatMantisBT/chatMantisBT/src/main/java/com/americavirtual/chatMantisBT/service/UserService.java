package com.americavirtual.chatMantisBT.service;

import java.util.List;

import com.americavirtual.chatMantisBT.entity.dto.ChangePasswordRequest;
import com.americavirtual.chatMantisBT.entity.dto.LoginRequest;
import com.americavirtual.chatMantisBT.entity.dto.UserRequest;
import com.americavirtual.chatMantisBT.entity.dto.UserResponse;

public interface UserService {
    
    /**
     * Creates a new user
     * @param userRequest user data
     * @return created user information
     */
    UserResponse createUser(UserRequest userRequest);
    
    /**
     * Authenticates user credentials
     * @param loginRequest login credentials
     * @return authenticated user information
     */
    UserResponse login(LoginRequest loginRequest);
    
    /**
     * Deletes a user by ID
     * @param userId user ID to delete
     */
    void deleteUser(Long userId);
    
    /**
     * Changes user password
     * @param userId user ID
     * @param changePasswordRequest current and new password
     */
    void changePassword(Long userId, ChangePasswordRequest changePasswordRequest);
    
    /**
     * Retrieves all users
     * @return list of all users
     */
    List<UserResponse> getAllUsers();
    
    /**
     * Retrieves a user by ID
     * @param userId user ID
     * @return user information
     */
    UserResponse getUserById(Long userId);
}
