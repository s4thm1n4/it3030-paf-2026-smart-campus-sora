package com.smartcampus.smart_campus_api.controller;

import com.smartcampus.smart_campus_api.dto.AssignTicketRequest;
import com.smartcampus.smart_campus_api.dto.CommentRequest;
import com.smartcampus.smart_campus_api.dto.CreateTicketRequest;
import com.smartcampus.smart_campus_api.dto.UpdateStatusRequest;
import com.smartcampus.smart_campus_api.model.Comment;
import com.smartcampus.smart_campus_api.model.Ticket;
import com.smartcampus.smart_campus_api.model.User;
import com.smartcampus.smart_campus_api.service.CommentService;
import com.smartcampus.smart_campus_api.service.TicketService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * MODULE C — Ticket REST API
 *
 * Endpoints:
 *   GET    /api/tickets                              — list all tickets
 *   GET    /api/tickets/{id}                         — get ticket by id
 *   GET    /api/tickets/my                           — get current user's tickets
 *   POST   /api/tickets                              — create a ticket
 *   PUT    /api/tickets/{id}                         — update a ticket
 *   DELETE /api/tickets/{id}                         — delete a ticket
 *   PATCH  /api/tickets/{id}/status                  — update ticket status
 *   PATCH  /api/tickets/{id}/assign                  — assign ticket to technician
 *   GET    /api/tickets/{id}/comments                — get comments for a ticket
 *   POST   /api/tickets/{id}/comments                — add comment to a ticket
 *   PUT    /api/tickets/{id}/comments/{commentId}    — update a comment
 *   DELETE /api/tickets/{id}/comments/{commentId}    — delete a comment
 *
 * @author Member 3 (M3)
 */
@RestController
@RequestMapping("/api/tickets")
public class TicketController {

    private final TicketService ticketService;
    private final CommentService commentService;

    public TicketController(TicketService ticketService, CommentService commentService) {
        this.ticketService = ticketService;
        this.commentService = commentService;
    }

    /** GET /api/tickets — list all tickets */
    @GetMapping
    public ResponseEntity<List<Ticket>> getAll() {
        return ResponseEntity.ok(ticketService.getAll());
    }

    /** GET /api/tickets/my — get current user's tickets */
    @GetMapping("/my")
    public ResponseEntity<List<Ticket>> getMyTickets(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(ticketService.getMyTickets(user));
    }

    /** GET /api/tickets/{id} — get ticket by id */
    @GetMapping("/{id}")
    public ResponseEntity<Ticket> getById(@PathVariable Long id) {
        return ResponseEntity.ok(ticketService.getById(id));
    }

    /** POST /api/tickets — create a new ticket */
    @PostMapping
    public ResponseEntity<Ticket> create(
            @Valid @RequestBody CreateTicketRequest request,
            @AuthenticationPrincipal User user) {
        Ticket ticket = ticketService.create(request, user);
        return ResponseEntity.status(201).body(ticket);
    }

    /** PUT /api/tickets/{id} — update a ticket */
    @PutMapping("/{id}")
    public ResponseEntity<Ticket> update(
            @PathVariable Long id,
            @Valid @RequestBody CreateTicketRequest request,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(ticketService.update(id, request, user));
    }

    /** DELETE /api/tickets/{id} — delete a ticket */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(
            @PathVariable Long id,
            @AuthenticationPrincipal User user) {
        ticketService.delete(id, user);
        return ResponseEntity.noContent().build();
    }

    /** PATCH /api/tickets/{id}/status — update ticket status */
    @PatchMapping("/{id}/status")
    public ResponseEntity<Ticket> updateStatus(
            @PathVariable Long id,
            @Valid @RequestBody UpdateStatusRequest request) {
        return ResponseEntity.ok(ticketService.updateStatus(id, request.status()));
    }

    /** PATCH /api/tickets/{id}/assign — assign ticket to technician */
    @PatchMapping("/{id}/assign")
    public ResponseEntity<Ticket> assign(
            @PathVariable Long id,
            @Valid @RequestBody AssignTicketRequest request) {
        return ResponseEntity.ok(ticketService.assign(id, request.technicianId()));
    }

    // ── Comment endpoints ──

    /** GET /api/tickets/{id}/comments — get comments for a ticket */
    @GetMapping("/{id}/comments")
    public ResponseEntity<List<Comment>> getComments(@PathVariable Long id) {
        return ResponseEntity.ok(commentService.getComments(id));
    }

    /** POST /api/tickets/{id}/comments — add a comment */
    @PostMapping("/{id}/comments")
    public ResponseEntity<Comment> addComment(
            @PathVariable Long id,
            @Valid @RequestBody CommentRequest request,
            @AuthenticationPrincipal User user) {
        Comment comment = commentService.addComment(id, request.content(), user);
        return ResponseEntity.status(201).body(comment);
    }

    /** PUT /api/tickets/{id}/comments/{commentId} — update a comment */
    @PutMapping("/{id}/comments/{commentId}")
    public ResponseEntity<Comment> updateComment(
            @PathVariable Long id,
            @PathVariable Long commentId,
            @Valid @RequestBody CommentRequest request,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(commentService.updateComment(id, commentId, request.content(), user));
    }

    /** DELETE /api/tickets/{id}/comments/{commentId} — delete a comment */
    @DeleteMapping("/{id}/comments/{commentId}")
    public ResponseEntity<Void> deleteComment(
            @PathVariable Long id,
            @PathVariable Long commentId,
            @AuthenticationPrincipal User user) {
        commentService.deleteComment(id, commentId, user);
        return ResponseEntity.noContent().build();
    }
}
