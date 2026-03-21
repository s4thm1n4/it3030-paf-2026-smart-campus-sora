package com.smartcampus.smart_campus_api.dto;

import com.smartcampus.smart_campus_api.model.FacilityStatus;
import com.smartcampus.smart_campus_api.model.FacilityType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

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

    @PositiveOrZero(message = "Capacity must be zero or greater")
    private Integer capacity;

    private String location;

    @NotNull(message = "Status is required")
    private FacilityStatus status;
}
