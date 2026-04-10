package com.smartcampus.smart_campus_api.dto;

import com.smartcampus.smart_campus_api.model.TicketCategory;
import com.smartcampus.smart_campus_api.model.TicketPriority;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class TicketCreateRequest {

    @NotBlank(message = "Title is required")
    private String title;

    @NotBlank(message = "Description is required")
    private String description;

    @NotNull(message = "Category is required")
    private TicketCategory category;

    @NotNull(message = "Priority is required")
    private TicketPriority priority;

    private String contactName;
    private String contactEmail;
    private String contactPhone;
    private String location;
    private Long facilityId;
}
