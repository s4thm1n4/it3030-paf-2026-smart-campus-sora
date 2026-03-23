package com.smartcampus.smart_campus_api.controller;

import com.smartcampus.smart_campus_api.dto.FacilitySummary;
import com.smartcampus.smart_campus_api.model.FacilityStatus;
import com.smartcampus.smart_campus_api.repository.FacilityRepository;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * Read-only catalogue for linking tickets to campus facilities.
 */
@RestController
@RequestMapping("/api/facilities")
public class FacilityController {

    private final FacilityRepository facilityRepository;

    public FacilityController(FacilityRepository facilityRepository) {
        this.facilityRepository = facilityRepository;
    }

    @GetMapping
    public List<FacilitySummary> listActive() {
        return facilityRepository.findByStatus(FacilityStatus.ACTIVE).stream()
                .map(f -> new FacilitySummary(f.getId(), f.getName(), f.getLocation()))
                .toList();
    }
}
