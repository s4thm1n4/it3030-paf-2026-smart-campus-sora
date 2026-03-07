package com.smartcampus.smart_campus_api.dto;

/**
 * Response returned after a successful Google login.
 * Contains the JWT token and basic user info for the frontend.
 *
 * @author Member 4 (M4)
 */
public record AuthResponse(
        String token,
        Long id,
        String name,
        String email,
        String role,
        String profilePictureUrl
) {}

