package com.smartcampus.smart_campus_api.dto;

import com.smartcampus.smart_campus_api.model.NotificationType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

/**
 * Request body for creating a notification.
 *
 * @author Member 4 (M4)
 */
public record CreateNotificationRequest(
        @NotNull(message = "Recipient ID is required")
        Long recipientId,

        @NotBlank(message = "Title is required")
        String title,

        @NotBlank(message = "Message is required")
        String message,

        @NotNull(message = "Notification type is required")
        NotificationType type,

        String referenceUrl
) {}
