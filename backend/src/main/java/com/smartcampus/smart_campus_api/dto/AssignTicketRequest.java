package com.smartcampus.smart_campus_api.dto;

import jakarta.validation.constraints.NotNull;

public record AssignTicketRequest(
        @NotNull(message = "Technician id is required") Long technicianId
) {}
