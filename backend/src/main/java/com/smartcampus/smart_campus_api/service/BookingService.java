package com.smartcampus.smart_campus_api.service;

import com.smartcampus.smart_campus_api.exception.BadRequestException;
import com.smartcampus.smart_campus_api.exception.ConflictException;
import com.smartcampus.smart_campus_api.exception.ResourceNotFoundException;
import com.smartcampus.smart_campus_api.model.Booking;
import com.smartcampus.smart_campus_api.model.BookingStatus;
import com.smartcampus.smart_campus_api.model.Facility;
import com.smartcampus.smart_campus_api.model.NotificationType;
import com.smartcampus.smart_campus_api.model.User;
import com.smartcampus.smart_campus_api.repository.BookingRepository;
import com.smartcampus.smart_campus_api.repository.FacilityRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
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
    private final NotificationService notificationService;

    public BookingService(BookingRepository bookingRepository,
                          FacilityRepository facilityRepository,
                          NotificationService notificationService) {
        this.bookingRepository = bookingRepository;
        this.facilityRepository = facilityRepository;
        this.notificationService = notificationService;
    }

    /** Get all bookings with optional filters (admin). */
    public List<Booking> getAll(BookingStatus status, Long facilityId, LocalDate dateFrom, LocalDate dateTo) {
        List<Booking> all = bookingRepository.findAll();

        return all.stream()
                .filter(b -> status == null || b.getStatus() == status)
                .filter(b -> facilityId == null || b.getFacility().getId().equals(facilityId))
                .filter(b -> dateFrom == null || !b.getBookingDate().isBefore(dateFrom))
                .filter(b -> dateTo == null || !b.getBookingDate().isAfter(dateTo))
                .toList();
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
     * Update a PENDING booking.
     * Only the owner can update, and only while status is PENDING.
     */
    @Transactional
    public Booking update(Long id, Long facilityId, Booking updated, User user) {
        Booking booking = getById(id);

        if (!booking.getRequestedBy().getId().equals(user.getId())) {
            throw new BadRequestException("You can only update your own bookings");
        }

        if (booking.getStatus() != BookingStatus.PENDING) {
            throw new BadRequestException("Only PENDING bookings can be updated");
        }

        Facility facility = facilityRepository.findById(facilityId)
                .orElseThrow(() -> new ResourceNotFoundException("Facility not found with id: " + facilityId));

        if (!updated.getStartTime().isBefore(updated.getEndTime())) {
            throw new BadRequestException("Start time must be before end time");
        }

        // Check for scheduling conflicts (exclude current booking)
        List<Booking> conflicts = bookingRepository.findConflictingBookingsExcluding(
                facilityId,
                updated.getBookingDate(),
                updated.getStartTime(),
                updated.getEndTime(),
                id
        );
        if (!conflicts.isEmpty()) {
            throw new ConflictException("This facility already has a booking during the requested time slot");
        }

        booking.setFacility(facility);
        booking.setBookingDate(updated.getBookingDate());
        booking.setStartTime(updated.getStartTime());
        booking.setEndTime(updated.getEndTime());
        booking.setPurpose(updated.getPurpose());
        booking.setAttendeeCount(updated.getAttendeeCount());

        return bookingRepository.save(booking);
    }

    /**
     * Cancel a booking.
     * Only the user who requested it can cancel, while it is PENDING or APPROVED.
     */
    @Transactional
    public Booking cancel(Long id, User user) {
        Booking booking = getById(id);

        if (!booking.getRequestedBy().getId().equals(user.getId())) {
            throw new BadRequestException("You can only cancel your own bookings");
        }

        if (booking.getStatus() != BookingStatus.PENDING && booking.getStatus() != BookingStatus.APPROVED) {
            throw new BadRequestException("Only PENDING or APPROVED bookings can be cancelled");
        }

        booking.setStatus(BookingStatus.CANCELLED);
        Booking saved = bookingRepository.save(booking);

        notificationService.createNotification(
                booking.getRequestedBy().getId(),
                "Booking Cancelled",
                "Your booking for " + booking.getFacility().getName() + " on " + booking.getBookingDate() + " has been cancelled.",
                NotificationType.BOOKING_CANCELLED,
                "/bookings"
        );

        return saved;
    }

    /**
     * Delete a booking.
     * Owner can delete own CANCELLED/REJECTED bookings. Admin can delete any.
     */
    @Transactional
    public void delete(Long id, User user) {
        Booking booking = getById(id);

        boolean isOwner = booking.getRequestedBy().getId().equals(user.getId());
        boolean isAdmin = user.getRole() == com.smartcampus.smart_campus_api.model.Role.ADMIN;

        if (isAdmin) {
            bookingRepository.delete(booking);
            return;
        }

        if (!isOwner) {
            throw new BadRequestException("You can only delete your own bookings");
        }

        if (booking.getStatus() != BookingStatus.CANCELLED && booking.getStatus() != BookingStatus.REJECTED) {
            throw new BadRequestException("Only CANCELLED or REJECTED bookings can be deleted");
        }

        bookingRepository.delete(booking);
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

        Booking saved = bookingRepository.save(booking);

        notificationService.createNotification(
                booking.getRequestedBy().getId(),
                "Booking Approved",
                "Your booking for " + booking.getFacility().getName() + " on " + booking.getBookingDate() + " has been approved." + (remarks != null && !remarks.isBlank() ? " Remarks: " + remarks : ""),
                NotificationType.BOOKING_APPROVED,
                "/bookings"
        );

        return saved;
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

        Booking saved = bookingRepository.save(booking);

        notificationService.createNotification(
                booking.getRequestedBy().getId(),
                "Booking Rejected",
                "Your booking for " + booking.getFacility().getName() + " on " + booking.getBookingDate() + " has been rejected." + (remarks != null && !remarks.isBlank() ? " Remarks: " + remarks : ""),
                NotificationType.BOOKING_REJECTED,
                "/bookings"
        );

        return saved;
    }
}
