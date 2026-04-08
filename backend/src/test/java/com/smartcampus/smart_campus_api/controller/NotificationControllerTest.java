package com.smartcampus.smart_campus_api.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.smartcampus.smart_campus_api.model.*;
import com.smartcampus.smart_campus_api.repository.NotificationRepository;
import com.smartcampus.smart_campus_api.repository.UserRepository;
import com.smartcampus.smart_campus_api.security.JwtUtil;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Integration tests for NotificationController — full HTTP layer with real DB.
 *
 * @author Member 4 (M4)
 */
@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class NotificationControllerTest {

    @Autowired private MockMvc mockMvc;
    @Autowired private ObjectMapper objectMapper;
    @Autowired private UserRepository userRepository;
    @Autowired private NotificationRepository notificationRepository;
    @Autowired private JwtUtil jwtUtil;

    private User testUser;
    private User adminUser;
    private String userToken;
    private String adminToken;

    @BeforeEach
    void setUp() {
        notificationRepository.deleteAll();
        userRepository.deleteAll();

        testUser = userRepository.save(User.builder()
                .email("user@sliit.lk").name("Test User").role(Role.USER)
                .googleId("google-user-1").build());

        adminUser = userRepository.save(User.builder()
                .email("admin@sliit.lk").name("Admin User").role(Role.ADMIN)
                .googleId("google-admin-1").build());

        userToken = jwtUtil.generateToken(testUser.getId(), testUser.getEmail(), "USER");
        adminToken = jwtUtil.generateToken(adminUser.getId(), adminUser.getEmail(), "ADMIN");
    }

    // ── GET /api/notifications ──

    @Test
    void getAll_shouldReturnNotificationsForAuthenticatedUser() throws Exception {
        notificationRepository.save(Notification.builder()
                .recipient(testUser).title("Test").message("Body")
                .type(NotificationType.SYSTEM).build());

        mockMvc.perform(get("/api/notifications")
                        .header("Authorization", "Bearer " + userToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].title").value("Test"));
    }

    @Test
    void getAll_shouldReturn401WithoutToken() throws Exception {
        mockMvc.perform(get("/api/notifications"))
                .andExpect(status().isUnauthorized());
    }

    // ── GET /api/notifications/unread ──

    @Test
    void getUnread_shouldReturnOnlyUnreadNotifications() throws Exception {
        notificationRepository.save(Notification.builder()
                .recipient(testUser).title("Unread").message("Body")
                .type(NotificationType.SYSTEM).read(false).build());
        notificationRepository.save(Notification.builder()
                .recipient(testUser).title("Read").message("Body")
                .type(NotificationType.SYSTEM).read(true).build());

        mockMvc.perform(get("/api/notifications/unread")
                        .header("Authorization", "Bearer " + userToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].title").value("Unread"));
    }

    // ── GET /api/notifications/unread/count ──

    @Test
    void getUnreadCount_shouldReturnCorrectCount() throws Exception {
        notificationRepository.save(Notification.builder()
                .recipient(testUser).title("N1").message("Body")
                .type(NotificationType.SYSTEM).read(false).build());
        notificationRepository.save(Notification.builder()
                .recipient(testUser).title("N2").message("Body")
                .type(NotificationType.SYSTEM).read(false).build());

        mockMvc.perform(get("/api/notifications/unread/count")
                        .header("Authorization", "Bearer " + userToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.count").value(2));
    }

    // ── POST /api/notifications (admin only) ──

    @Test
    void create_shouldReturn201WhenAdminCreatesNotification() throws Exception {
        String body = objectMapper.writeValueAsString(new java.util.HashMap<>() {{
            put("recipientId", testUser.getId());
            put("title", "System Alert");
            put("message", "Maintenance tonight");
            put("type", "SYSTEM");
        }});

        mockMvc.perform(post("/api/notifications")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.title").value("System Alert"));
    }

    @Test
    void create_shouldReturn403WhenNonAdminAttempts() throws Exception {
        String body = objectMapper.writeValueAsString(new java.util.HashMap<>() {{
            put("recipientId", testUser.getId());
            put("title", "Hack");
            put("message", "Unauthorized");
            put("type", "SYSTEM");
        }});

        mockMvc.perform(post("/api/notifications")
                        .header("Authorization", "Bearer " + userToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isForbidden());
    }

    // ── PUT /api/notifications/{id}/read ──

    @Test
    void markAsRead_shouldSetReadToTrue() throws Exception {
        Notification n = notificationRepository.save(Notification.builder()
                .recipient(testUser).title("Mark me").message("Body")
                .type(NotificationType.BOOKING_APPROVED).read(false).build());

        mockMvc.perform(put("/api/notifications/" + n.getId() + "/read")
                        .header("Authorization", "Bearer " + userToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.read").value(true));
    }

    @Test
    void markAsRead_shouldReturn404ForOtherUsersNotification() throws Exception {
        Notification n = notificationRepository.save(Notification.builder()
                .recipient(adminUser).title("Admin's").message("Body")
                .type(NotificationType.SYSTEM).build());

        mockMvc.perform(put("/api/notifications/" + n.getId() + "/read")
                        .header("Authorization", "Bearer " + userToken))
                .andExpect(status().isNotFound());
    }

    // ── PUT /api/notifications/read-all ──

    @Test
    void markAllAsRead_shouldReturn204() throws Exception {
        notificationRepository.save(Notification.builder()
                .recipient(testUser).title("N1").message("Body")
                .type(NotificationType.SYSTEM).read(false).build());

        mockMvc.perform(put("/api/notifications/read-all")
                        .header("Authorization", "Bearer " + userToken))
                .andExpect(status().isNoContent());
    }

    // ── DELETE /api/notifications/{id} ──

    @Test
    void delete_shouldReturn204WhenOwnerDeletes() throws Exception {
        Notification n = notificationRepository.save(Notification.builder()
                .recipient(testUser).title("Delete me").message("Body")
                .type(NotificationType.SYSTEM).build());

        mockMvc.perform(delete("/api/notifications/" + n.getId())
                        .header("Authorization", "Bearer " + userToken))
                .andExpect(status().isNoContent());
    }

    @Test
    void delete_shouldReturn404WhenNonOwnerAttempts() throws Exception {
        Notification n = notificationRepository.save(Notification.builder()
                .recipient(adminUser).title("Not yours").message("Body")
                .type(NotificationType.SYSTEM).build());

        mockMvc.perform(delete("/api/notifications/" + n.getId())
                        .header("Authorization", "Bearer " + userToken))
                .andExpect(status().isNotFound());
    }
}
