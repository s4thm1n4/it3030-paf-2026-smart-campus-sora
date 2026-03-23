package com.smartcampus.smart_campus_api.dto;

import jakarta.validation.constraints.NotBlank;

public record CommentRequest(
        @NotBlank(message = "Content is required") String content
) {}
