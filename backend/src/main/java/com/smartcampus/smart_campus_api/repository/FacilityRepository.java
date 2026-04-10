package com.smartcampus.smart_campus_api.repository;

import com.smartcampus.smart_campus_api.model.Facility;
import com.smartcampus.smart_campus_api.model.FacilityType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface FacilityRepository extends JpaRepository<Facility, Long> {

    @Query("SELECT f FROM Facility f WHERE " +
            "(:type IS NULL OR f.type = :type) AND " +
            "(:capacity IS NULL OR f.capacity >= :capacity) AND " +
            "(:location IS NULL OR :location = '' OR LOWER(f.location) LIKE LOWER(CONCAT('%', :location, '%')))")
    List<Facility> findWithFilters(
            @Param("type") FacilityType type,
            @Param("capacity") Integer capacity,
            @Param("location") String location);
}