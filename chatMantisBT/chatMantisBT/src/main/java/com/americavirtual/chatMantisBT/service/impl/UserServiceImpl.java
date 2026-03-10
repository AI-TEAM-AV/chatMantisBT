package com.americavirtual.chatMantisBT.service.impl;

import java.util.List;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.americavirtual.chatMantisBT.entity.User;
import com.americavirtual.chatMantisBT.entity.dto.ChangePasswordRequest;
import com.americavirtual.chatMantisBT.entity.dto.AdminChangePasswordRequest;
import com.americavirtual.chatMantisBT.entity.dto.LoginRequest;
import com.americavirtual.chatMantisBT.entity.dto.UserRequest;
import com.americavirtual.chatMantisBT.entity.dto.UserResponse;
import com.americavirtual.chatMantisBT.repository.UserRepository;
import com.americavirtual.chatMantisBT.service.UserService;

@Service
@Transactional
public class UserServiceImpl implements UserService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Override
    public UserResponse createUser(UserRequest userRequest) {
        // Verify if email already exists
        if (userRepository.existsByEmail(userRequest.getEmail())) {
            throw new IllegalArgumentException("Email already exists: " + userRequest.getEmail());
        }

        // Create new user
        User user = new User(userRequest);
        
        // Encrypt password
        user.setPassword(passwordEncoder.encode(userRequest.getPassword()));
        
        // Save user
        User savedUser = userRepository.save(user);
        
        return new UserResponse(savedUser);
    }

    @Override
    @Transactional(readOnly = true)
    public UserResponse login(LoginRequest loginRequest) {
        // Find user by email
        User user = userRepository.findByEmail(loginRequest.getEmail())
                .orElseThrow(() -> new IllegalArgumentException("Invalid email or password"));

        // Verify password
        if (!passwordEncoder.matches(loginRequest.getPassword(), user.getPassword())) {
            throw new IllegalArgumentException("Invalid email or password");
        }

        return new UserResponse(user);
    }

    @Override
    public void deleteUser(Long userId) {
        // Verify if user exists
        if (!userRepository.existsById(userId)) {
            throw new IllegalArgumentException("User not found with ID: " + userId);
        }

        userRepository.deleteById(userId);
    }

    @Override
    public void changePassword(Long userId, ChangePasswordRequest changePasswordRequest) {
        // Find user
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found with ID: " + userId));

        // Verify current password
        if (!passwordEncoder.matches(changePasswordRequest.getCurrentPassword(), user.getPassword())) {
            throw new IllegalArgumentException("Current password is incorrect");
        }

        // Update password
        user.setPassword(passwordEncoder.encode(changePasswordRequest.getNewPassword()));
        userRepository.save(user);
    }
    
    @Override
    public void adminChangePassword(Long userId, AdminChangePasswordRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found with ID: " + userId));

        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);
    }

    @Override
    @Transactional(readOnly = true)
    public List<UserResponse> getAllUsers() {
        return userRepository.findAll()
                .stream()
                .map(UserResponse::new)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public UserResponse getUserById(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found with ID: " + userId));
        
        return new UserResponse(user);
    }
}
