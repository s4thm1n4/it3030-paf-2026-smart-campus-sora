package com.smartcampus.smart_campus_api.service;

import com.smartcampus.smart_campus_api.exception.ResourceNotFoundException;
import com.smartcampus.smart_campus_api.model.Facility;
import com.smartcampus.smart_campus_api.model.FacilityType;
import com.smartcampus.smart_campus_api.repository.FacilityRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Stream;

@Service
public class FacilityService {

    private final FacilityRepository facilityRepository;

    public FacilityService(FacilityRepository facilityRepository) {
        this.facilityRepository = facilityRepository;
    }

    @Transactional
    public Facility createFacility(Facility facility) {
        return facilityRepository.save(facility);
    }

    public List<Facility> getAllFacilities() {
        return facilityRepository.findAll();
    }

    public Facility getFacilityById(Long id) {
        return facilityRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Facility", "id", id));
    }

    @Transactional
    public Facility updateFacility(Long id, Facility facility) {
        Facility existingFacility = getFacilityById(id);
        existingFacility.setName(facility.getName());
        existingFacility.setType(facility.getType());
        existingFacility.setCapacity(facility.getCapacity());
        existingFacility.setLocation(facility.getLocation());
        existingFacility.setStatus(facility.getStatus());
        return facilityRepository.save(existingFacility);
    }

    @Transactional
    public void deleteFacility(Long id) {
        Facility facility = getFacilityById(id);
        facilityRepository.delete(facility);
    }

    public List<Facility> getFacilitiesByType(FacilityType type) {
        return facilityRepository.findByType(type);
    }

    public List<Facility> getFacilitiesByCapacity(Integer capacity) {
        return facilityRepository.findByCapacity(capacity);
    }

    public List<Facility> getFacilitiesByLocation(String location) {
        return facilityRepository.findByLocationContainingIgnoreCase(location);
    }

    public List<Facility> getFilteredFacilities(FacilityType type, Integer capacity, String location) {
        Stream<Facility> facilities = facilityRepository.findAll().stream();

        if (type != null) {
            facilities = facilities.filter(facility -> facility.getType() == type);
        }
        if (capacity != null) {
            facilities = facilities.filter(facility -> capacity.equals(facility.getCapacity()));
        }
        if (location != null && !location.isBlank()) {
            facilities = facilities.filter(facility ->
                    facility.getLocation() != null &&
                    facility.getLocation().toLowerCase().contains(location.toLowerCase()));
        }

        return facilities.toList();
    }
}
