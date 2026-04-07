package com.smartcampus.smart_campus_api.controller;

import com.smartcampus.smart_campus_api.model.Role;
import com.smartcampus.smart_campus_api.model.User;
import com.smartcampus.smart_campus_api.service.UserService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * Admin-only endpoints for user management.
 * All routes require ADMIN role (enforced by SecurityConfig).
 *
 * @author Member 4 (M4)
 */
@RestController
@RequestMapping("/api/admin")
public class AdminController {

    private final UserService userService;

    public AdminController(UserService userService) {
        this.userService = userService;
    }

    /** GET /api/admin/users — list all users */
    @GetMapping("/users")
    public ResponseEntity<List<User>> getAllUsers() {
        return ResponseEntity.ok(userService.findAll());
    }

    /** PATCH /api/admin/users/{id}/role — change a user's role */
    @PatchMapping("/users/{id}/role")
    public ResponseEntity<User> updateRole(
            @PathVariable Long id,
            @RequestBody Map<String, String> body) {
        String roleStr = body.get("role");
        Role role = Role.valueOf(roleStr);
        User updated = userService.updateRole(id, role);
        return ResponseEntity.ok(updated);
    }
}
