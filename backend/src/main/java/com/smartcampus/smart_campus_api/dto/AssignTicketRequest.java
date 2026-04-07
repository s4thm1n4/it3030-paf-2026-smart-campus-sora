package com.smartcampus.smart_campus_api.dto;

import jakarta.validation.constraints.NotNull;

/**
 * Request body for assigning a ticket to a technician.
 *
 * @author Member 3 (M3)
 */
public record AssignTicketRequest(
        @NotNull(message = "Technician ID is required")
        Long technicianId
) {}
