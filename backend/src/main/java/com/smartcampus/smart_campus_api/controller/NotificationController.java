package com.smartcampus.smart_campus_api.controller;

import com.smartcampus.smart_campus_api.dto.CreateNotificationRequest;
import com.smartcampus.smart_campus_api.dto.NotificationResponse;
import com.smartcampus.smart_campus_api.model.Notification;
import com.smartcampus.smart_campus_api.model.User;
import com.smartcampus.smart_campus_api.service.NotificationService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import com.smartcampus.smart_campus_api.model.NotificationType;

import java.util.List;
import java.util.Map;

/**
 * MODULE D — Notification REST API
 *
 * Endpoints:
 *   GET    /api/notifications              — list all for current user
 *   GET    /api/notifications/unread        — list unread only
 *   GET    /api/notifications/unread/count  — get unread count
 *   POST   /api/notifications              — create a notification (admin/system)
 *   PUT    /api/notifications/{id}/read     — mark one as read
 *   PUT    /api/notifications/read-all      — mark all as read
 *   DELETE /api/notifications/{id}          — delete one notification
 *
 * @author Member 4 (M4)
 */
@RestController
@RequestMapping("/api/notifications")
public class NotificationController {

    private final NotificationService notificationService;

    public NotificationController(NotificationService notificationService) {
        this.notificationService = notificationService;
    }

    /** GET /api/notifications — list all notifications for the logged-in user */
    @GetMapping
    public ResponseEntity<List<NotificationResponse>> getAll(@AuthenticationPrincipal User user) {
        List<NotificationResponse> notifications = notificationService.getAll(user.getId())
                .stream()
                .map(NotificationResponse::from)
                .toList();
        return ResponseEntity.ok(notifications);
    }

    /** GET /api/notifications/unread — list unread notifications only */
    @GetMapping("/unread")
    public ResponseEntity<List<NotificationResponse>> getUnread(@AuthenticationPrincipal User user) {
        List<NotificationResponse> notifications = notificationService.getUnread(user.getId())
                .stream()
                .map(NotificationResponse::from)
                .toList();
        return ResponseEntity.ok(notifications);
    }

    /** GET /api/notifications/unread/count — get unread count */
    @GetMapping("/unread/count")
    public ResponseEntity<Map<String, Long>> getUnreadCount(@AuthenticationPrincipal User user) {
        long count = notificationService.getUnreadCount(user.getId());
        return ResponseEntity.ok(Map.of("count", count));
    }

    /** POST /api/notifications — create a notification (admin only via REST; other modules call service directly) */
    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping
    public ResponseEntity<NotificationResponse> create(
            @Valid @RequestBody CreateNotificationRequest request) {
        Notification notification = notificationService.createNotification(
                request.recipientId(),
                request.title(),
                request.message(),
                request.type(),
                request.referenceUrl()
        );
        return ResponseEntity.status(201).body(NotificationResponse.from(notification));
    }

    /** PUT /api/notifications/{id}/read — mark a single notification as read */
    @PutMapping("/{id}/read")
    public ResponseEntity<NotificationResponse> markAsRead(
            @PathVariable Long id,
            @AuthenticationPrincipal User user) {
        Notification notification = notificationService.markAsRead(id, user.getId());
        return ResponseEntity.ok(NotificationResponse.from(notification));
    }

    /** PUT /api/notifications/read-all — mark all notifications as read */
    @PutMapping("/read-all")
    public ResponseEntity<Void> markAllAsRead(@AuthenticationPrincipal User user) {
        notificationService.markAllAsRead(user.getId());
        return ResponseEntity.noContent().build();
    }

    /** DELETE /api/notifications/{id} — delete a notification */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(
            @PathVariable Long id,
            @AuthenticationPrincipal User user) {
        notificationService.delete(id, user.getId());
        return ResponseEntity.noContent().build();
    }

    /**
     * POST /api/notifications/seed — generate sample notifications for the current user.
     * Dev/demo only — useful for viva demonstrations.
     */
    @PostMapping("/seed")
    public ResponseEntity<Map<String, String>> seed(@AuthenticationPrincipal User user) {
        Long id = user.getId();

        notificationService.createNotification(id,
                "Booking Approved", "Your booking for Lecture Hall A on March 25 has been approved.",
                NotificationType.BOOKING_APPROVED, "/bookings");

        notificationService.createNotification(id,
                "Booking Rejected", "Your booking for Computer Lab 3 was rejected due to a scheduling conflict.",
                NotificationType.BOOKING_REJECTED, "/bookings");

        notificationService.createNotification(id,
                "Ticket Assigned", "You have been assigned to ticket #42: Projector not working in Room 201.",
                NotificationType.TICKET_ASSIGNED, "/tickets");

        notificationService.createNotification(id,
                "Ticket Status Updated", "Ticket #38 (AC Maintenance) has been marked as Resolved.",
                NotificationType.TICKET_STATUS_CHANGED, "/tickets");

        notificationService.createNotification(id,
                "New Comment", "Admin commented on your ticket #42: 'Technician will visit tomorrow.'",
                NotificationType.NEW_COMMENT, "/tickets");

        notificationService.createNotification(id,
                "System Announcement", "Smart Campus will undergo scheduled maintenance on April 1st, 10 PM - 2 AM.",
                NotificationType.SYSTEM, null);

        return ResponseEntity.ok(Map.of("message", "6 sample notifications created"));
    }
}
