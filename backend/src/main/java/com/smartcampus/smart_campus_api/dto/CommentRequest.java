package com.smartcampus.smart_campus_api.dto;

import jakarta.validation.constraints.NotBlank;

/**
 * Request body for creating or updating a comment.
 *
 * @author Member 3 (M3)
 */
public record CommentRequest(
        @NotBlank(message = "Content is required")
        String content
) {}
