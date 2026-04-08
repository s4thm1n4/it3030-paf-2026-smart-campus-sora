package com.smartcampus.smart_campus_api.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.smartcampus.smart_campus_api.model.Role;
import com.smartcampus.smart_campus_api.model.User;
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
 * Integration tests for AdminController — role management and user listing.
 *
 * @author Member 4 (M4)
 */
@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class AdminControllerTest {

    @Autowired private MockMvc mockMvc;
    @Autowired private ObjectMapper objectMapper;
    @Autowired private UserRepository userRepository;
    @Autowired private JwtUtil jwtUtil;

    private User adminUser;
    private User regularUser;
    private String adminToken;
    private String userToken;

    @BeforeEach
    void setUp() {
        userRepository.deleteAll();

        adminUser = userRepository.save(User.builder()
                .email("admin@sliit.lk").name("Admin").role(Role.ADMIN)
                .googleId("google-admin").build());

        regularUser = userRepository.save(User.builder()
                .email("user@sliit.lk").name("Regular User").role(Role.USER)
                .googleId("google-user").build());

        adminToken = jwtUtil.generateToken(adminUser.getId(), adminUser.getEmail(), "ADMIN");
        userToken = jwtUtil.generateToken(regularUser.getId(), regularUser.getEmail(), "USER");
    }

    // ── GET /api/admin/users ──

    @Test
    void getUsers_shouldReturnAllUsersForAdmin() throws Exception {
        mockMvc.perform(get("/api/admin/users")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(2)));
    }

    @Test
    void getUsers_shouldReturn403ForNonAdmin() throws Exception {
        mockMvc.perform(get("/api/admin/users")
                        .header("Authorization", "Bearer " + userToken))
                .andExpect(status().isForbidden());
    }

    @Test
    void getUsers_shouldReturn401WithoutToken() throws Exception {
        mockMvc.perform(get("/api/admin/users"))
                .andExpect(status().isUnauthorized());
    }

    // ── PATCH /api/admin/users/{id}/role ──

    @Test
    void updateRole_shouldChangeRoleWhenAdmin() throws Exception {
        String body = objectMapper.writeValueAsString(
                new java.util.HashMap<>() {{ put("role", "TECHNICIAN"); }});

        mockMvc.perform(patch("/api/admin/users/" + regularUser.getId() + "/role")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.role").value("TECHNICIAN"));
    }

    @Test
    void updateRole_shouldReturn403ForNonAdmin() throws Exception {
        String body = objectMapper.writeValueAsString(
                new java.util.HashMap<>() {{ put("role", "ADMIN"); }});

        mockMvc.perform(patch("/api/admin/users/" + regularUser.getId() + "/role")
                        .header("Authorization", "Bearer " + userToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isForbidden());
    }

    @Test
    void updateRole_shouldReturn400ForInvalidRole() throws Exception {
        String body = "{\"role\": \"SUPERUSER\"}";

        mockMvc.perform(patch("/api/admin/users/" + regularUser.getId() + "/role")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isBadRequest());
    }

    @Test
    void updateRole_shouldReturn404ForNonExistentUser() throws Exception {
        String body = objectMapper.writeValueAsString(
                new java.util.HashMap<>() {{ put("role", "ADMIN"); }});

        mockMvc.perform(patch("/api/admin/users/99999/role")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isNotFound());
    }
}
