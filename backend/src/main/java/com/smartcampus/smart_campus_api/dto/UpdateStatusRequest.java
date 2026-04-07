package com.smartcampus.smart_campus_api.dto;

import jakarta.validation.constraints.NotBlank;

/**
 * Request body for updating ticket status.
 *
 * @author Member 3 (M3)
 */
public record UpdateStatusRequest(
        @NotBlank(message = "Status is required")
        String status
) {}
