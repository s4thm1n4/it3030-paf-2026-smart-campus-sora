package com.smartcampus.smart_campus_api.service;

import com.smartcampus.smart_campus_api.exception.ResourceNotFoundException;
import com.smartcampus.smart_campus_api.model.Notification;
import com.smartcampus.smart_campus_api.model.NotificationType;
import com.smartcampus.smart_campus_api.model.Role;
import com.smartcampus.smart_campus_api.model.User;
import com.smartcampus.smart_campus_api.repository.NotificationRepository;
import com.smartcampus.smart_campus_api.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

/**
 * Unit tests for NotificationService — CRUD and ownership verification.
 *
 * @author Member 4 (M4)
 */
@ExtendWith(MockitoExtension.class)
class NotificationServiceTest {

    @Mock
    private NotificationRepository notificationRepository;

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private NotificationService notificationService;

    private User testUser;
    private User otherUser;

    @BeforeEach
    void setUp() {
        testUser = User.builder().id(1L).email("user@sliit.lk").name("Test User").role(Role.USER).build();
        otherUser = User.builder().id(2L).email("other@sliit.lk").name("Other User").role(Role.USER).build();
    }

    // ── createNotification ──

    @Test
    void createNotification_shouldSaveAndReturn() {
        when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));
        when(notificationRepository.save(any(Notification.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        Notification result = notificationService.createNotification(
                1L, "Booking Approved", "Your booking was approved.",
                NotificationType.BOOKING_APPROVED, "/bookings/5");

        assertNotNull(result);
        assertEquals("Booking Approved", result.getTitle());
        assertEquals(NotificationType.BOOKING_APPROVED, result.getType());
        assertEquals(testUser, result.getRecipient());
        assertFalse(result.isRead());

        verify(notificationRepository).save(any(Notification.class));
    }

    @Test
    void createNotification_shouldThrowWhenRecipientNotFound() {
        when(userRepository.findById(999L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class,
                () -> notificationService.createNotification(
                        999L, "Title", "Message", NotificationType.SYSTEM, null));
    }

    // ── getAll ──

    @Test
    void getAll_shouldReturnNotificationsForUser() {
        Notification n1 = Notification.builder().id(1L).recipient(testUser).title("N1").build();
        Notification n2 = Notification.builder().id(2L).recipient(testUser).title("N2").build();

        when(notificationRepository.findByRecipientIdOrderByCreatedAtDesc(1L))
                .thenReturn(List.of(n1, n2));

        List<Notification> result = notificationService.getAll(1L);
        assertEquals(2, result.size());
    }

    // ── getUnread ──

    @Test
    void getUnread_shouldReturnOnlyUnreadNotifications() {
        Notification unread = Notification.builder().id(1L).recipient(testUser).title("Unread").read(false).build();

        when(notificationRepository.findByRecipientIdAndReadFalseOrderByCreatedAtDesc(1L))
                .thenReturn(List.of(unread));

        List<Notification> result = notificationService.getUnread(1L);
        assertEquals(1, result.size());
        assertFalse(result.get(0).isRead());
    }

    // ── getUnreadCount ──

    @Test
    void getUnreadCount_shouldReturnCorrectCount() {
        when(notificationRepository.countByRecipientIdAndReadFalse(1L)).thenReturn(5L);
        assertEquals(5L, notificationService.getUnreadCount(1L));
    }

    // ── markAsRead ──

    @Test
    void markAsRead_shouldSetReadToTrue() {
        Notification notification = Notification.builder()
                .id(10L).recipient(testUser).title("Test").read(false).build();

        when(notificationRepository.findById(10L)).thenReturn(Optional.of(notification));
        when(notificationRepository.save(any(Notification.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        Notification result = notificationService.markAsRead(10L, 1L);
        assertTrue(result.isRead());
    }

    @Test
    void markAsRead_shouldThrowWhenNotificationNotFound() {
        when(notificationRepository.findById(999L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class,
                () -> notificationService.markAsRead(999L, 1L));
    }

    @Test
    void markAsRead_shouldThrowWhenUserDoesNotOwnNotification() {
        Notification notification = Notification.builder()
                .id(10L).recipient(otherUser).title("Not yours").build();

        when(notificationRepository.findById(10L)).thenReturn(Optional.of(notification));

        assertThrows(ResourceNotFoundException.class,
                () -> notificationService.markAsRead(10L, 1L));
    }

    // ── markAllAsRead ──

    @Test
    void markAllAsRead_shouldMarkAllUnreadAsRead() {
        Notification n1 = Notification.builder().id(1L).recipient(testUser).read(false).build();
        Notification n2 = Notification.builder().id(2L).recipient(testUser).read(false).build();

        when(notificationRepository.findByRecipientIdAndReadFalseOrderByCreatedAtDesc(1L))
                .thenReturn(List.of(n1, n2));

        notificationService.markAllAsRead(1L);

        assertTrue(n1.isRead());
        assertTrue(n2.isRead());
        verify(notificationRepository).saveAll(anyList());
    }

    // ── delete ──

    @Test
    void delete_shouldRemoveNotification() {
        Notification notification = Notification.builder()
                .id(10L).recipient(testUser).title("To delete").build();

        when(notificationRepository.findById(10L)).thenReturn(Optional.of(notification));

        notificationService.delete(10L, 1L);

        verify(notificationRepository).delete(notification);
    }

    @Test
    void delete_shouldThrowWhenUserDoesNotOwnNotification() {
        Notification notification = Notification.builder()
                .id(10L).recipient(otherUser).title("Not yours").build();

        when(notificationRepository.findById(10L)).thenReturn(Optional.of(notification));

        assertThrows(ResourceNotFoundException.class,
                () -> notificationService.delete(10L, 1L));

        verify(notificationRepository, never()).delete(any());
    }
}
