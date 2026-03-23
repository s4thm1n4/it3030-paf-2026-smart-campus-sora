package com.smartcampus.smart_campus_api.dto;

import com.smartcampus.smart_campus_api.model.TicketStatus;

import java.time.LocalDateTime;

public record StatusHistoryEntry(
        Long id,
        TicketStatus fromStatus,
        TicketStatus toStatus,
        UserSummary changedBy,
        String note,
        LocalDateTime createdAt
) {}
