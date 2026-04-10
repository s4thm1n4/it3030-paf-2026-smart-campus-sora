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
        existingFacility.setAvailableFrom(facilityDTO.getAvailableFrom());
        existingFacility.setAvailableTo(facilityDTO.getAvailableTo());
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

    public List<FacilityDTO> getFilteredFacilities(FacilityType type, Integer capacity, String location) {
        return facilityRepository.findWithFilters(type, capacity, location)
                .stream()
                .map(facilityMapper::toDto)
                .toList();
    }
}