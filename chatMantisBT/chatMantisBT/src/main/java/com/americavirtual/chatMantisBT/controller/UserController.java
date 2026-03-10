package com.americavirtual.chatMantisBT.controller;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.americavirtual.chatMantisBT.entity.dto.ChangePasswordRequest;
import com.americavirtual.chatMantisBT.entity.dto.AdminChangePasswordRequest;
import com.americavirtual.chatMantisBT.entity.dto.LoginRequest;
import com.americavirtual.chatMantisBT.entity.dto.UserRequest;
import com.americavirtual.chatMantisBT.entity.dto.UserResponse;
import com.americavirtual.chatMantisBT.service.UserService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/v1/users")
public class UserController {
    @Autowired
    private UserService userService;

    /**
     * Creates a new user
     * POST /api/users
     */
    @PostMapping
    public ResponseEntity<UserResponse> createUser(@Valid @RequestBody UserRequest userRequest) {
        UserResponse response = userService.createUser(userRequest);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    /**
     * Authenticates user credentials
     * POST /api/v1/users/login
     */
    @PostMapping("/login")
    public ResponseEntity<UserResponse> login(@Valid @RequestBody LoginRequest loginRequest) {
        UserResponse response = userService.login(loginRequest);
        return ResponseEntity.ok(response);
    }

    /**
     * Retrieves all users
     * GET /api/users
     */
    @GetMapping
    public ResponseEntity<List<UserResponse>> getAllUsers() {
        List<UserResponse> users = userService.getAllUsers();
        return ResponseEntity.ok(users);
    }

    /**
     * Retrieves a user by ID
     * GET /api/users/{userId}
     */
    @GetMapping("/{userId}")
    public ResponseEntity<UserResponse> getUserById(@PathVariable Long userId) {
        UserResponse response = userService.getUserById(userId);
        return ResponseEntity.ok(response);
    }

    /**
     * Changes user password
     * PATCH /api/users/{userId}/password
     */
    @PatchMapping("/{userId}/password")
    public ResponseEntity<Void> changePassword(
            @PathVariable Long userId,
            @Valid @RequestBody ChangePasswordRequest changePasswordRequest) {
        userService.changePassword(userId, changePasswordRequest);
        return ResponseEntity.noContent().build();
    }
    
    /**
     * Allows an admin to reset a user's password without the current password.
     * PATCH /api/v1/users/{userId}/password/admin
     */
    @PatchMapping("/{userId}/password/admin")
    public ResponseEntity<Void> adminChangePassword(
            @PathVariable Long userId,
            @Valid @RequestBody AdminChangePasswordRequest request) {
        userService.adminChangePassword(userId, request);
        return ResponseEntity.noContent().build();
    }

    /**
     * Deletes a user by ID
     * DELETE /api/users/{userId}
     */
    @DeleteMapping("/{userId}")
    public ResponseEntity<Void> deleteUser(@PathVariable Long userId) {
        userService.deleteUser(userId);
        return ResponseEntity.noContent().build();
    }
}
