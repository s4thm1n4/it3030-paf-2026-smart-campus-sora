package com.smartcampus.smart_campus_api.mapper;

import com.smartcampus.smart_campus_api.dto.FacilityDTO;
import com.smartcampus.smart_campus_api.model.Facility;
import org.springframework.stereotype.Component;

@Component
public class FacilityMapper {

    public FacilityDTO toDto(Facility facility) {
        if (facility == null) {
            return null;
        }

        return FacilityDTO.builder()
                .id(facility.getId())
                .name(facility.getName())
                .type(facility.getType())
                .capacity(facility.getCapacity())
                .location(facility.getLocation())
                .description(facility.getDescription())
                .imageUrl(facility.getImageUrl())
                .availableFrom(facility.getAvailableFrom())
                .availableTo(facility.getAvailableTo())
                .status(facility.getStatus())
                .build();
    }

    public Facility toEntity(FacilityDTO facilityDTO) {
        if (facilityDTO == null) {
            return null;
        }

        return Facility.builder()
                .id(facilityDTO.getId())
                .name(facilityDTO.getName())
                .type(facilityDTO.getType())
                .capacity(facilityDTO.getCapacity())
                .location(facilityDTO.getLocation())
                .description(facilityDTO.getDescription())
                .imageUrl(facilityDTO.getImageUrl())
                .availableFrom(facilityDTO.getAvailableFrom())
                .availableTo(facilityDTO.getAvailableTo())
                .status(facilityDTO.getStatus())
                .build();
    }
}
