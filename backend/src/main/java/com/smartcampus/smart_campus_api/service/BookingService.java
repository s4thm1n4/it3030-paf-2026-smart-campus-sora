package com.smartcampus.smart_campus_api.service;

import com.smartcampus.smart_campus_api.exception.BadRequestException;
import com.smartcampus.smart_campus_api.exception.ConflictException;
import com.smartcampus.smart_campus_api.exception.ResourceNotFoundException;
import com.smartcampus.smart_campus_api.model.Booking;
import com.smartcampus.smart_campus_api.model.BookingStatus;
import com.smartcampus.smart_campus_api.model.Facility;
import com.smartcampus.smart_campus_api.model.User;
import com.smartcampus.smart_campus_api.repository.BookingRepository;
import com.smartcampus.smart_campus_api.repository.FacilityRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * MODULE B — Booking business logic.
 * Handles creating, cancelling, approving, and rejecting facility bookings.
 *
 * @author Member 2 (M2)
 */
@Service
public class BookingService {

    private final BookingRepository bookingRepository;
    private final FacilityRepository facilityRepository;

    public BookingService(BookingRepository bookingRepository,
                          FacilityRepository facilityRepository) {
        this.bookingRepository = bookingRepository;
        this.facilityRepository = facilityRepository;
    }

    /** Get all bookings. */
    public List<Booking> getAll() {
        return bookingRepository.findAll();
    }

    /** Get a booking by ID or throw 404. */
    public Booking getById(Long id) {
        return bookingRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Booking not found with id: " + id));
    }

    /** Get all bookings requested by the given user. */
    public List<Booking> getMyBookings(User user) {
        return bookingRepository.findByRequestedById(user.getId());
    }

    /**
     * Create a new booking.
     * Sets requestedBy to the current user, status to PENDING,
     * and checks for scheduling conflicts.
     */
    @Transactional
    public Booking create(Long facilityId, Booking booking, User user) {
        Facility facility = facilityRepository.findById(facilityId)
                .orElseThrow(() -> new ResourceNotFoundException("Facility not found with id: " + facilityId));

        // Validate time range
        if (!booking.getStartTime().isBefore(booking.getEndTime())) {
            throw new BadRequestException("Start time must be before end time");
        }

        // Check for scheduling conflicts
        List<Booking> conflicts = bookingRepository.findConflictingBookings(
                facilityId,
                booking.getBookingDate(),
                booking.getStartTime(),
                booking.getEndTime()
        );
        if (!conflicts.isEmpty()) {
            throw new ConflictException("This facility already has a booking during the requested time slot");
        }

        booking.setFacility(facility);
        booking.setRequestedBy(user);
        booking.setStatus(BookingStatus.PENDING);

        return bookingRepository.save(booking);
    }

    /**
     * Cancel a booking.
     * Only the user who requested it can cancel, and only while it is PENDING.
     */
    @Transactional
    public Booking cancel(Long id, User user) {
        Booking booking = getById(id);

        if (!booking.getRequestedBy().getId().equals(user.getId())) {
            throw new BadRequestException("You can only cancel your own bookings");
        }

        if (booking.getStatus() != BookingStatus.PENDING) {
            throw new BadRequestException("Only PENDING bookings can be cancelled");
        }

        booking.setStatus(BookingStatus.CANCELLED);
        return bookingRepository.save(booking);
    }

    /**
     * Approve a pending booking (admin action).
     */
    @Transactional
    public Booking approve(Long id, String remarks, User adminUser) {
        Booking booking = getById(id);

        if (booking.getStatus() != BookingStatus.PENDING) {
            throw new BadRequestException("Only PENDING bookings can be approved");
        }

        booking.setStatus(BookingStatus.APPROVED);
        booking.setAdminRemarks(remarks);
        booking.setReviewedBy(adminUser);

        return bookingRepository.save(booking);
    }

    /**
     * Reject a pending booking (admin action).
     */
    @Transactional
    public Booking reject(Long id, String remarks, User adminUser) {
        Booking booking = getById(id);

        if (booking.getStatus() != BookingStatus.PENDING) {
            throw new BadRequestException("Only PENDING bookings can be rejected");
        }

        booking.setStatus(BookingStatus.REJECTED);
        booking.setAdminRemarks(remarks);
        booking.setReviewedBy(adminUser);

        return bookingRepository.save(booking);
    }
}
