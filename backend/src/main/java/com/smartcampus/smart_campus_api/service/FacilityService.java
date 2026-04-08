package com.smartcampus.smart_campus_api.service;

import com.smartcampus.smart_campus_api.model.Facility;
import com.smartcampus.smart_campus_api.model.FacilityStatus;
import com.smartcampus.smart_campus_api.model.FacilityType;
import com.smartcampus.smart_campus_api.repository.FacilityRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
@RequiredArgsConstructor
public class FacilityService {
    private final FacilityRepository facilityRepository;

    public List<Facility> getAll() {
        return facilityRepository.findAll();
    }

    public Facility getById(Long id) {
        return facilityRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Facility not found"));
    }

    public Facility create(Facility facility) {
        return facilityRepository.save(facility);
    }

    public Facility update(Long id, Facility updated) {
        Facility facility = getById(id);
        facility.setName(updated.getName());
        facility.setType(updated.getType());
        facility.setDescription(updated.getDescription());
        facility.setLocation(updated.getLocation());
        facility.setCapacity(updated.getCapacity());
        facility.setStatus(updated.getStatus());
        facility.setImageUrl(updated.getImageUrl());
        return facilityRepository.save(facility);
    }

    public void delete(Long id) {
        facilityRepository.deleteById(id);
    }

    public List<Facility> search(FacilityType type, String location, Integer minCapacity) {
        return facilityRepository.searchFacilities(type, location, minCapacity);
    }
}
