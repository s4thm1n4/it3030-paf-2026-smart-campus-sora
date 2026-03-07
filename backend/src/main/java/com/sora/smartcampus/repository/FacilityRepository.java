package com.sora.smartcampus.repository;

import com.sora.smartcampus.model.Facility;
import com.sora.smartcampus.model.FacilityStatus;
import com.sora.smartcampus.model.FacilityType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface FacilityRepository extends JpaRepository<Facility, Long> {

    List<Facility> findByType(FacilityType type);

    List<Facility> findByStatus(FacilityStatus status);

    List<Facility> findByLocationContainingIgnoreCase(String location);

    @Query("SELECT f FROM Facility f WHERE f.capacity >= :minCapacity AND f.status = 'ACTIVE'")
    List<Facility> findAvailableByMinCapacity(@Param("minCapacity") int minCapacity);

    @Query("SELECT f FROM Facility f WHERE " +
           "(:type IS NULL OR f.type = :type) AND " +
           "(:location IS NULL OR LOWER(f.location) LIKE LOWER(CONCAT('%', :location, '%'))) AND " +
           "(:minCapacity IS NULL OR f.capacity >= :minCapacity) AND " +
           "f.status = 'ACTIVE'")
    List<Facility> searchFacilities(
        @Param("type") FacilityType type,
        @Param("location") String location,
        @Param("minCapacity") Integer minCapacity
    );
}
