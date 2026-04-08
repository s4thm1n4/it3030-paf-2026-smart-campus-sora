package com.smartcampus.smart_campus_api.dto;

import com.smartcampus.smart_campus_api.model.Notification;
import com.smartcampus.smart_campus_api.model.NotificationType;

import java.time.LocalDateTime;

/**
 * Response DTO for notifications — avoids exposing the raw entity.
 *
 * @author Member 4 (M4)
 */
public record NotificationResponse(
        Long id,
        String title,
        String message,
        NotificationType type,
        String referenceUrl,
        boolean read,
        LocalDateTime createdAt
) {
    public static NotificationResponse from(Notification n) {
        return new NotificationResponse(
                n.getId(),
                n.getTitle(),
                n.getMessage(),
                n.getType(),
                n.getReferenceUrl(),
                n.isRead(),
                n.getCreatedAt()
        );
    }
}
