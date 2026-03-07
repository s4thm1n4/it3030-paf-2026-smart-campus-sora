package com.smartcampus.smart_campus_api.dto;

/**
 * Represents a user's public profile — returned by GET /api/auth/me.
 *
 * @author Member 4 (M4)
 */
public record UserProfileResponse(
        Long id,
        String name,
        String email,
        String role,
        String profilePictureUrl
) {}

