package com.smartcampus.smart_campus_api.controller;

import com.smartcampus.smart_campus_api.model.Facility;
import com.smartcampus.smart_campus_api.model.FacilityType;
import com.smartcampus.smart_campus_api.service.FacilityService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/facilities")
@RequiredArgsConstructor
public class FacilityController {
    private final FacilityService facilityService;

    @GetMapping
    public ResponseEntity<List<Facility>> getAll() {
        return ResponseEntity.ok(facilityService.getAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Facility> getById(@PathVariable Long id) {
        return ResponseEntity.ok(facilityService.getById(id));
    }

    @PostMapping
    public ResponseEntity<Facility> create(@RequestBody Facility facility) {
        return ResponseEntity.status(HttpStatus.CREATED).body(facilityService.create(facility));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Facility> update(@PathVariable Long id, @RequestBody Facility facility) {
        return ResponseEntity.ok(facilityService.update(id, facility));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        facilityService.delete(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/search")
    public ResponseEntity<List<Facility>> search(
            @RequestParam(required = false) FacilityType type,
            @RequestParam(required = false) String location,
            @RequestParam(required = false) Integer minCapacity) {
        return ResponseEntity.ok(facilityService.search(type, location, minCapacity));
    }
}
