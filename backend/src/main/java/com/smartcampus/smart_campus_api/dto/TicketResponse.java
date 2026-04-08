package com.smartcampus.smart_campus_api.dto;

import com.smartcampus.smart_campus_api.model.TicketCategory;
import com.smartcampus.smart_campus_api.model.TicketPriority;
import com.smartcampus.smart_campus_api.model.TicketStatus;

import java.time.LocalDateTime;
import java.util.List;

public record TicketResponse(
        Long id,
        String title,
        String description,
        TicketCategory category,
        TicketPriority priority,
        TicketStatus status,
        UserSummary createdBy,
        UserSummary assignedTo,
        FacilitySummary facility,
        String contactName,
        String contactEmail,
        String contactPhone,
        String location,
        List<String> imageUrls,
        String resolutionNotes,
        String rejectionReason,
        LocalDateTime createdAt,
        LocalDateTime updatedAt,
        List<StatusHistoryEntry> statusHistory
) {}
