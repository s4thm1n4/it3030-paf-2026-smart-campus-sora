package com.smartcampus.smart_campus_api.repository;

import com.smartcampus.smart_campus_api.model.Facility;
import com.smartcampus.smart_campus_api.model.FacilityType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface FacilityRepository extends JpaRepository<Facility, Long> {

    List<Facility> findByType(FacilityType type);

    List<Facility> findByCapacity(Integer capacity);

    List<Facility> findByLocationContainingIgnoreCase(String location);
}
