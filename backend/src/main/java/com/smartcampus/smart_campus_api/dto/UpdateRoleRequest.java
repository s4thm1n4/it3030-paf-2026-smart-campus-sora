package com.smartcampus.smart_campus_api.dto;

import com.smartcampus.smart_campus_api.model.Role;
import jakarta.validation.constraints.NotNull;

/**
 * Request body for changing a user's role.
 *
 * @author Member 4 (M4)
 */
public record UpdateRoleRequest(
        @NotNull(message = "Role is required")
        Role role
) {}
