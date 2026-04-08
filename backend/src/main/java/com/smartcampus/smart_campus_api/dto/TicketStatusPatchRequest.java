package com.smartcampus.smart_campus_api.dto;

import com.smartcampus.smart_campus_api.model.TicketStatus;
import jakarta.validation.constraints.NotNull;

public record TicketStatusPatchRequest(
        @NotNull(message = "Status is required") TicketStatus status,
        String resolutionNotes,
        String rejectionReason
) {}
