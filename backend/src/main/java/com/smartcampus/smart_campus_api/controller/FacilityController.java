package com.smartcampus.smart_campus_api.controller;

import com.smartcampus.smart_campus_api.dto.FacilityDTO;
import com.smartcampus.smart_campus_api.model.FacilityType;
import com.smartcampus.smart_campus_api.service.FacilityService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/facilities")
public class FacilityController {

    private final FacilityService facilityService;

    public FacilityController(FacilityService facilityService) {
        this.facilityService = facilityService;
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<FacilityDTO> createFacility(@Valid @RequestBody FacilityDTO facilityDTO) {
        FacilityDTO createdFacility = facilityService.createFacility(facilityDTO);
        return ResponseEntity.status(HttpStatus.CREATED).body(createdFacility);
    }

    @GetMapping
    public ResponseEntity<List<FacilityDTO>> getFacilities(
            @RequestParam(required = false) FacilityType type,
            @RequestParam(required = false) Integer capacity,
            @RequestParam(required = false) String location) {
        return ResponseEntity.ok(facilityService.getFilteredFacilities(type, capacity, location));
    }

    @GetMapping("/{id}")
    public ResponseEntity<FacilityDTO> getFacilityById(@PathVariable Long id) {
        return ResponseEntity.ok(facilityService.getFacilityById(id));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<FacilityDTO> updateFacility(@PathVariable Long id, @Valid @RequestBody FacilityDTO facilityDTO) {
        return ResponseEntity.ok(facilityService.updateFacility(id, facilityDTO));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deleteFacility(@PathVariable Long id) {
        facilityService.deleteFacility(id);
        return ResponseEntity.ok().build();
    }
}
