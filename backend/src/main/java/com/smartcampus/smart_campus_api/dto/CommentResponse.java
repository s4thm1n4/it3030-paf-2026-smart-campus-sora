package com.smartcampus.smart_campus_api.dto;

import java.time.LocalDateTime;

public record CommentResponse(
        Long id,
        String content,
        UserSummary author,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {}
