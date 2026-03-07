package com.smartcampus.smart_campus_api.service;

import com.smartcampus.smart_campus_api.model.Role;
import com.smartcampus.smart_campus_api.model.User;
import com.smartcampus.smart_campus_api.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

/**
 * Service for user management.
 * Handles find-or-create from Google OAuth.
 *
 * @author Member 4 (M4)
 */
@Service
public class UserService {

    private final UserRepository userRepository;

    public UserService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    /**
     * Find existing user by Google ID or email.
     * If not found, create a new USER-role account.
     */
    @Transactional
    public User findOrCreateFromGoogle(String googleId, String email, String name, String pictureUrl) {
        // First try by googleId
        Optional<User> byGoogleId = userRepository.findByGoogleId(googleId);
        if (byGoogleId.isPresent()) {
            User user = byGoogleId.get();
            // Update profile picture in case it changed
            user.setProfilePictureUrl(pictureUrl);
            user.setName(name);
            return userRepository.save(user);
        }

        // Then try by email (e.g. user existed before OAuth was added)
        Optional<User> byEmail = userRepository.findByEmail(email);
        if (byEmail.isPresent()) {
            User user = byEmail.get();
            user.setGoogleId(googleId);
            user.setProfilePictureUrl(pictureUrl);
            return userRepository.save(user);
        }

        // Brand new user — create with default USER role
        User newUser = User.builder()
                .googleId(googleId)
                .email(email)
                .name(name)
                .profilePictureUrl(pictureUrl)
                .role(Role.USER)
                .build();
        return userRepository.save(newUser);
    }

    public Optional<User> findById(Long id) {
        return userRepository.findById(id);
    }

    public List<User> findAll() {
        return userRepository.findAll();
    }

    /** Promote a user to ADMIN role (Admin only). */
    @Transactional
    public User updateRole(Long userId, Role role) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        user.setRole(role);
        return userRepository.save(user);
    }
}

