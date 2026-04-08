package com.smartcampus.smart_campus_api.dto;

import com.smartcampus.smart_campus_api.model.FacilityStatus;
import com.smartcampus.smart_campus_api.model.FacilityType;
import com.fasterxml.jackson.annotation.JsonFormat;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FacilityDTO {

    private Long id;

    @NotBlank(message = "Name is required")
    private String name;

    @NotNull(message = "Type is required")
    private FacilityType type;

    @NotNull(message = "Capacity is required")
    @Min(value = 1, message = "Capacity must be at least 1")
    private Integer capacity;

    @NotBlank(message = "Location is required")
    private String location;

    private String description;

    private String imageUrl;

    @JsonFormat(pattern = "HH:mm")
    private LocalTime availableFrom;

    @JsonFormat(pattern = "HH:mm")
    private LocalTime availableTo;

    @NotNull(message = "Status is required")
    private FacilityStatus status;
}
