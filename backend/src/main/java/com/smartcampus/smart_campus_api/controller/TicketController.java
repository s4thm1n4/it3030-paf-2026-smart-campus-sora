package com.smartcampus.smart_campus_api.controller;

import com.smartcampus.smart_campus_api.dto.*;
import com.smartcampus.smart_campus_api.model.User;
import com.smartcampus.smart_campus_api.service.TicketService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/tickets")
public class TicketController {

    private final TicketService ticketService;

    public TicketController(TicketService ticketService) {
        this.ticketService = ticketService;
    }

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> create(
            @Valid @ModelAttribute TicketCreateRequest request,
            @RequestParam(value = "images", required = false) MultipartFile[] images,
            @AuthenticationPrincipal User user
    ) {
        // If the user is not authenticated, return a clear 401 response instead of letting
        // a downstream DB constraint (created_by NOT NULL) cause a 500.
        if (user == null) {
            Map<String, Object> body = new HashMap<>();
            body.put("timestamp", LocalDateTime.now());
            body.put("status", HttpStatus.UNAUTHORIZED.value());
            body.put("error", HttpStatus.UNAUTHORIZED.getReasonPhrase());
            body.put("message", "Authentication required: please sign in before submitting a ticket.");
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(body);
        }

        return ResponseEntity.status(HttpStatus.CREATED).body(ticketService.create(request, images, user));
    }

    @GetMapping("/my")
    public List<TicketResponse> listMine(@AuthenticationPrincipal User user) {
        return ticketService.listMine(user);
    }

    /** Full queue for operations staff */
    @GetMapping("/all")
    @PreAuthorize("hasAnyRole('ADMIN','TECHNICIAN','MANAGER')")
    public List<TicketResponse> listAll() {
        return ticketService.listAllForStaff();
    }

    /** Tickets assigned to the current technician */
    @GetMapping("/assigned")
    @PreAuthorize("hasRole('TECHNICIAN')")
    public List<TicketResponse> listAssigned(@AuthenticationPrincipal User user) {
        return ticketService.listAssigned(user);
    }

    @GetMapping("/technicians")
    @PreAuthorize("hasRole('ADMIN')")
    public List<UserSummary> listTechnicians() {
        return ticketService.listTechnicians();
    }

    @GetMapping("/{id:\\d+}")
    public TicketResponse getById(@PathVariable Long id, @AuthenticationPrincipal User user) {
        return ticketService.getById(id, user);
    }

    @PutMapping("/{id:\\d+}")
    public TicketResponse update(
            @PathVariable Long id,
            @Valid @RequestBody TicketUpdateRequest request,
            @AuthenticationPrincipal User user
    ) {
        return ticketService.update(id, request, user);
    }

    @PatchMapping("/{id:\\d+}/status")
    public TicketResponse patchStatus(
            @PathVariable Long id,
            @Valid @RequestBody TicketStatusPatchRequest request,
            @AuthenticationPrincipal User user
    ) {
        return ticketService.patchStatus(id, request, user);
    }

    @PatchMapping("/{id}/assign")
    @PreAuthorize("hasRole('ADMIN')")
    public TicketResponse assign(
            @PathVariable Long id,
            @Valid @RequestBody AssignTicketRequest request,
            @AuthenticationPrincipal User user
    ) {
        return ticketService.assign(id, request, user);
    }

    @DeleteMapping("/{id:\\d+}")
    public ResponseEntity<Void> delete(@PathVariable Long id, @AuthenticationPrincipal User user) {
        ticketService.delete(id, user);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{id}/comments")
    public List<CommentResponse> listComments(@PathVariable Long id, @AuthenticationPrincipal User user) {
        return ticketService.listComments(id, user);
    }

    @PostMapping("/{id:\\d+}/comments")
    public ResponseEntity<CommentResponse> addComment(
            @PathVariable Long id,
            @Valid @RequestBody CommentRequest request,
            @AuthenticationPrincipal User user
    ) {
        return ResponseEntity.status(HttpStatus.CREATED).body(ticketService.addComment(id, request, user));
    }

    @PutMapping("/{id:\\d+}/comments/{commentId:\\d+}")
    public CommentResponse updateComment(
            @PathVariable Long id,
            @PathVariable Long commentId,
            @Valid @RequestBody CommentRequest request,
            @AuthenticationPrincipal User user
    ) {
        return ticketService.updateComment(id, commentId, request, user);
    }

    @DeleteMapping("/{id:\\d+}/comments/{commentId:\\d+}")
    public ResponseEntity<Void> deleteComment(
            @PathVariable Long id,
            @PathVariable Long commentId,
            @AuthenticationPrincipal User user
    ) {
        ticketService.deleteComment(id, commentId, user);
        return ResponseEntity.noContent().build();
    }
}
