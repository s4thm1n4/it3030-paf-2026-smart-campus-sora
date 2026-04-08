package com.smartcampus.smart_campus_api.service;

import com.smartcampus.smart_campus_api.exception.ResourceNotFoundException;
import com.smartcampus.smart_campus_api.model.Notification;
import com.smartcampus.smart_campus_api.model.NotificationType;
import com.smartcampus.smart_campus_api.model.User;
import com.smartcampus.smart_campus_api.repository.NotificationRepository;
import com.smartcampus.smart_campus_api.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * MODULE D — Notification business logic.
 * Handles CRUD operations and provides a helper method
 * that other modules (M2 Bookings, M3 Tickets) can call
 * to trigger notifications automatically.
 *
 * @author Member 4 (M4)
 */
@Service
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;

    public NotificationService(NotificationRepository notificationRepository,
                               UserRepository userRepository) {
        this.notificationRepository = notificationRepository;
        this.userRepository = userRepository;
    }

    /** Get all notifications for a user (newest first). */
    public List<Notification> getAll(Long userId) {
        return notificationRepository.findByRecipientIdOrderByCreatedAtDesc(userId);
    }

    /** Get only unread notifications for a user. */
    public List<Notification> getUnread(Long userId) {
        return notificationRepository.findByRecipientIdAndReadFalseOrderByCreatedAtDesc(userId);
    }

    /** Get unread notification count for a user. */
    public long getUnreadCount(Long userId) {
        return notificationRepository.countByRecipientIdAndReadFalse(userId);
    }

    /**
     * Create a notification.
     * This is the method other modules (M2, M3) should call to trigger notifications.
     *
     * Example usage from BookingService:
     *   notificationService.createNotification(
     *       bookerId, "Booking Approved", "Your booking for Room 101 was approved.",
     *       NotificationType.BOOKING_APPROVED, "/bookings/" + bookingId
     *   );
     */
    @Transactional
    public Notification createNotification(Long recipientId, String title, String message,
                                           NotificationType type, String referenceUrl) {
        User recipient = userRepository.findById(recipientId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + recipientId));

        Notification notification = Notification.builder()
                .recipient(recipient)
                .title(title)
                .message(message)
                .type(type)
                .referenceUrl(referenceUrl)
                .build();

        return notificationRepository.save(notification);
    }

    /** Mark a single notification as read. Verifies the caller owns it. */
    @Transactional
    public Notification markAsRead(Long notificationId, Long userId) {
        Notification notification = getOwnedNotification(notificationId, userId);
        notification.setRead(true);
        return notificationRepository.save(notification);
    }

    /** Mark all notifications as read for a user. */
    @Transactional
    public void markAllAsRead(Long userId) {
        List<Notification> unread = notificationRepository
                .findByRecipientIdAndReadFalseOrderByCreatedAtDesc(userId);
        unread.forEach(n -> n.setRead(true));
        notificationRepository.saveAll(unread);
    }

    /** Delete a single notification. Verifies the caller owns it. */
    @Transactional
    public void delete(Long notificationId, Long userId) {
        Notification notification = getOwnedNotification(notificationId, userId);
        notificationRepository.delete(notification);
    }

    /** Fetch a notification and verify the requesting user is the recipient. */
    private Notification getOwnedNotification(Long notificationId, Long userId) {
        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Notification not found with id: " + notificationId));

        if (!notification.getRecipient().getId().equals(userId)) {
            throw new ResourceNotFoundException(
                    "Notification not found with id: " + notificationId);
        }

        return notification;
    }
}
