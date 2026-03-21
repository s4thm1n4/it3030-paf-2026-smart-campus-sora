package com.smartcampus.smart_campus_api.service;

import com.smartcampus.smart_campus_api.dto.FacilityDTO;
import com.smartcampus.smart_campus_api.exception.ResourceNotFoundException;
import com.smartcampus.smart_campus_api.mapper.FacilityMapper;
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
    private final FacilityMapper facilityMapper;

    public FacilityService(FacilityRepository facilityRepository, FacilityMapper facilityMapper) {
        this.facilityRepository = facilityRepository;
        this.facilityMapper = facilityMapper;
    }

    @Transactional
    public FacilityDTO createFacility(FacilityDTO facilityDTO) {
        Facility facility = facilityMapper.toEntity(facilityDTO);
        Facility savedFacility = facilityRepository.save(facility);
        return facilityMapper.toDto(savedFacility);
    }

    public List<FacilityDTO> getAllFacilities() {
        return facilityRepository.findAll()
                .stream()
                .map(facilityMapper::toDto)
                .toList();
    }

    public FacilityDTO getFacilityById(Long id) {
        Facility facility = facilityRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Facility", "id", id));
        return facilityMapper.toDto(facility);
    }

    @Transactional
    public FacilityDTO updateFacility(Long id, FacilityDTO facilityDTO) {
        Facility existingFacility = facilityRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Facility", "id", id));

        existingFacility.setName(facilityDTO.getName());
        existingFacility.setType(facilityDTO.getType());
        existingFacility.setCapacity(facilityDTO.getCapacity());
        existingFacility.setLocation(facilityDTO.getLocation());
        existingFacility.setStatus(facilityDTO.getStatus());

        Facility updatedFacility = facilityRepository.save(existingFacility);
        return facilityMapper.toDto(updatedFacility);
    }

    @Transactional
    public void deleteFacility(Long id) {
        Facility facility = facilityRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Facility", "id", id));
        facilityRepository.delete(facility);
    }

    public List<FacilityDTO> getFacilitiesByType(FacilityType type) {
        return facilityRepository.findByType(type)
                .stream()
                .map(facilityMapper::toDto)
                .toList();
    }

    public List<FacilityDTO> getFacilitiesByCapacity(Integer capacity) {
        return facilityRepository.findByCapacity(capacity)
                .stream()
                .map(facilityMapper::toDto)
                .toList();
    }

    public List<FacilityDTO> getFacilitiesByLocation(String location) {
        return facilityRepository.findByLocationContainingIgnoreCase(location)
                .stream()
                .map(facilityMapper::toDto)
                .toList();
    }

    public List<FacilityDTO> getFilteredFacilities(FacilityType type, Integer capacity, String location) {
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

        return facilities
                .map(facilityMapper::toDto)
                .toList();
    }
}
