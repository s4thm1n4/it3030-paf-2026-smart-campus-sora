package com.smartcampus.smart_campus_api.controller;

import com.smartcampus.smart_campus_api.dto.AdminRemarkRequest;
import com.smartcampus.smart_campus_api.dto.CreateBookingRequest;
import com.smartcampus.smart_campus_api.model.Booking;
import com.smartcampus.smart_campus_api.model.BookingStatus;
import com.smartcampus.smart_campus_api.model.User;
import com.smartcampus.smart_campus_api.service.BookingService;
import jakarta.validation.Valid;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

/**
 * MODULE B — Booking REST API
 *
 * Endpoints:
 *   GET    /api/bookings              — list all bookings (admin, with filters)
 *   GET    /api/bookings/{id}         — get a single booking
 *   GET    /api/bookings/my           — list current user's bookings
 *   POST   /api/bookings              — create a new booking
 *   PUT    /api/bookings/{id}         — update a pending booking (owner)
 *   DELETE /api/bookings/{id}         — delete a booking (owner: cancelled/rejected; admin: any)
 *   PATCH  /api/bookings/{id}/cancel  — cancel a pending/approved booking
 *   PATCH  /api/bookings/{id}/approve — approve a pending booking (admin)
 *   PATCH  /api/bookings/{id}/reject  — reject a pending booking (admin)
 *
 * @author Member 2 (M2)
 */
@RestController
@RequestMapping("/api/bookings")
public class BookingController {

    private final BookingService bookingService;

    public BookingController(BookingService bookingService) {
        this.bookingService = bookingService;
    }

    /** GET /api/bookings — list all bookings (admin only, with optional filters) */
    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<Booking>> getAll(
            @RequestParam(required = false) BookingStatus status,
            @RequestParam(required = false) Long facilityId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dateFrom,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dateTo) {
        return ResponseEntity.ok(bookingService.getAll(status, facilityId, dateFrom, dateTo));
    }

    /** GET /api/bookings/my — list bookings for the authenticated user */
    @GetMapping("/my")
    public ResponseEntity<List<Booking>> getMyBookings(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(bookingService.getMyBookings(user));
    }

    /** GET /api/bookings/{id} — get a single booking by ID */
    @GetMapping("/{id}")
    public ResponseEntity<Booking> getById(@PathVariable Long id) {
        return ResponseEntity.ok(bookingService.getById(id));
    }

    /** POST /api/bookings — create a new booking */
    @PostMapping
    public ResponseEntity<Booking> create(
            @Valid @RequestBody CreateBookingRequest request,
            @AuthenticationPrincipal User user) {

        Booking booking = new Booking();
        booking.setBookingDate(request.getBookingDate());
        booking.setStartTime(request.getStartTime());
        booking.setEndTime(request.getEndTime());
        booking.setPurpose(request.getPurpose());
        booking.setAttendeeCount(request.getAttendeeCount());

        Booking created = bookingService.create(request.getFacilityId(), booking, user);
        return ResponseEntity.status(201).body(created);
    }

    /** PUT /api/bookings/{id} — update a pending booking (owner only) */
    @PutMapping("/{id}")
    public ResponseEntity<Booking> update(
            @PathVariable Long id,
            @Valid @RequestBody CreateBookingRequest request,
            @AuthenticationPrincipal User user) {

        Booking booking = new Booking();
        booking.setBookingDate(request.getBookingDate());
        booking.setStartTime(request.getStartTime());
        booking.setEndTime(request.getEndTime());
        booking.setPurpose(request.getPurpose());
        booking.setAttendeeCount(request.getAttendeeCount());

        Booking updated = bookingService.update(id, request.getFacilityId(), booking, user);
        return ResponseEntity.ok(updated);
    }

    /** DELETE /api/bookings/{id} — delete a booking */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(
            @PathVariable Long id,
            @AuthenticationPrincipal User user) {
        bookingService.delete(id, user);
        return ResponseEntity.noContent().build();
    }

    /** PATCH /api/bookings/{id}/cancel — cancel a pending/approved booking */
    @PatchMapping("/{id}/cancel")
    public ResponseEntity<Booking> cancel(
            @PathVariable Long id,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(bookingService.cancel(id, user));
    }

    /** PATCH /api/bookings/{id}/approve — approve a pending booking */
    @PatchMapping("/{id}/approve")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Booking> approve(
            @PathVariable Long id,
            @RequestBody AdminRemarkRequest request,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(bookingService.approve(id, request.getRemarks(), user));
    }

    /** PATCH /api/bookings/{id}/reject — reject a pending booking */
    @PatchMapping("/{id}/reject")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Booking> reject(
            @PathVariable Long id,
            @RequestBody AdminRemarkRequest request,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(bookingService.reject(id, request.getRemarks(), user));
    }
}
