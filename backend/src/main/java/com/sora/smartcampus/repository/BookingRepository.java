package com.sora.smartcampus.repository;

import com.sora.smartcampus.model.Booking;
import com.sora.smartcampus.model.BookingStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

@Repository
public interface BookingRepository extends JpaRepository<Booking, Long> {

    List<Booking> findByRequestedById(Long userId);

    List<Booking> findByFacilityId(Long facilityId);

    List<Booking> findByStatus(BookingStatus status);

    /** Check for overlapping bookings — used for conflict detection */
    @Query("SELECT b FROM Booking b WHERE b.facility.id = :facilityId " +
           "AND b.bookingDate = :date " +
           "AND b.status IN ('PENDING', 'APPROVED') " +
           "AND b.startTime < :endTime " +
           "AND b.endTime > :startTime")
    List<Booking> findConflictingBookings(
        @Param("facilityId") Long facilityId,
        @Param("date") LocalDate date,
        @Param("startTime") LocalTime startTime,
        @Param("endTime") LocalTime endTime
    );
}
