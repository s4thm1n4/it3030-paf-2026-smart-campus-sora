package com.smartcampus.smart_campus_api.service;

import com.smartcampus.smart_campus_api.dto.*;
import com.smartcampus.smart_campus_api.exception.BadRequestException;
import com.smartcampus.smart_campus_api.exception.ForbiddenException;
import com.smartcampus.smart_campus_api.exception.ResourceNotFoundException;
import com.smartcampus.smart_campus_api.model.*;
import com.smartcampus.smart_campus_api.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@Service
@Transactional
public class TicketService {

    private static final org.slf4j.Logger log = org.slf4j.LoggerFactory.getLogger(TicketService.class);

    private final TicketRepository ticketRepository;
    private final CommentRepository commentRepository;
    private final TicketStatusHistoryRepository ticketStatusHistoryRepository;
    private final UserRepository userRepository;
    private final FacilityRepository facilityRepository;
    private final FileStorageService fileStorageService;

    public TicketService(TicketRepository ticketRepository,
                         CommentRepository commentRepository,
                         TicketStatusHistoryRepository ticketStatusHistoryRepository,
                         UserRepository userRepository,
                         FacilityRepository facilityRepository,
                         FileStorageService fileStorageService) {
        this.ticketRepository = ticketRepository;
        this.commentRepository = commentRepository;
        this.ticketStatusHistoryRepository = ticketStatusHistoryRepository;
        this.userRepository = userRepository;
        this.facilityRepository = facilityRepository;
        this.fileStorageService = fileStorageService;
    }

    public TicketResponse create(TicketCreateRequest request, MultipartFile[] images, User creator) {
        try {
            List<String> imageUrls = fileStorageService.storeTicketImages(images);

            Facility facility = null;
            if (request.getFacilityId() != null) {
                facility = facilityRepository.findById(request.getFacilityId())
                        .orElseThrow(() -> new ResourceNotFoundException("Facility", "id", request.getFacilityId()));
            }

            Ticket ticket = Ticket.builder()
                    .title(request.getTitle().trim())
                    .description(request.getDescription().trim())
                    .category(request.getCategory())
                    .priority(request.getPriority())
                    .status(TicketStatus.OPEN)
                    .createdBy(creator)
                    .contactName(blankToNull(request.getContactName()))
                    .contactEmail(blankToNull(request.getContactEmail()))
                    .contactPhone(blankToNull(request.getContactPhone()))
                    .location(blankToNull(request.getLocation()))
                    .facility(facility)
                    .imageUrls(imageUrls)
                    .build();

            Ticket saved = ticketRepository.save(ticket);
            recordHistory(saved, null, TicketStatus.OPEN, creator, "Ticket created");
            return toResponse(saved.getId(), true);
        } catch (Exception e) {
            // Log full stack trace to help diagnose 500 errors during ticket creation
            log.error("Ticket creation failed: {}", e.getMessage(), e);
            throw e; // rethrow so centralized handler still maps to appropriate HTTP response
        }
    }

    @Transactional(readOnly = true)
    public List<TicketResponse> listMine(User user) {
        return ticketRepository.findMineWithDetails(user.getId()).stream()
                .map(t -> toResponse(t, false))
                .toList();
    }

    @Transactional(readOnly = true)
    public List<TicketResponse> listAllForStaff() {
        return ticketRepository.findAllWithDetails().stream()
                .map(t -> toResponse(t, false))
                .toList();
    }

    @Transactional(readOnly = true)
    public List<TicketResponse> listAssigned(User technician) {
        return ticketRepository.findAssignedWithDetails(technician.getId()).stream()
                .map(t -> toResponse(t, false))
                .toList();
    }

    @Transactional(readOnly = true)
    public TicketResponse getById(Long id, User user) {
        Ticket ticket = loadDetailed(id);
        assertCanView(ticket, user);
        return toResponse(ticket, true);
    }

    public TicketResponse update(Long id, TicketUpdateRequest request, User user) {
        Ticket ticket = loadDetailed(id);
        assertCanView(ticket, user);
        if (!(ticket.getStatus() == TicketStatus.OPEN || ticket.getStatus() == TicketStatus.IN_PROGRESS)) {
            throw new BadRequestException("Ticket can only be edited while OPEN or IN_PROGRESS");
        }
        if (!isCreator(ticket, user) && user.getRole() != Role.ADMIN) {
            throw new ForbiddenException("Only the reporter or an admin can edit this ticket");
        }

        Facility facility = null;
        if (request.getFacilityId() != null) {
            facility = facilityRepository.findById(request.getFacilityId())
                    .orElseThrow(() -> new ResourceNotFoundException("Facility", "id", request.getFacilityId()));
        }

        ticket.setTitle(request.getTitle().trim());
        ticket.setDescription(request.getDescription().trim());
        ticket.setCategory(request.getCategory());
        ticket.setPriority(request.getPriority());
        ticket.setContactName(blankToNull(request.getContactName()));
        ticket.setContactEmail(blankToNull(request.getContactEmail()));
        ticket.setContactPhone(blankToNull(request.getContactPhone()));
        ticket.setLocation(blankToNull(request.getLocation()));
        ticket.setFacility(facility);

        ticketRepository.save(ticket);
        return toResponse(ticket.getId(), true);
    }

    public TicketResponse patchStatus(Long id, TicketStatusPatchRequest request, User user) {
        Ticket ticket = loadDetailed(id);
        assertCanView(ticket, user);

        TicketStatus next = request.status();
        if (ticket.getStatus() == next && next != TicketStatus.REJECTED) {
            return toResponse(ticket.getId(), true);
        }

        if (next == TicketStatus.REJECTED) {
            if (user.getRole() != Role.ADMIN) {
                throw new ForbiddenException("Only an admin can reject tickets");
            }
            if (ticket.getStatus() != TicketStatus.OPEN) {
                throw new BadRequestException("Only OPEN tickets can be rejected");
            }
            String reason = request.rejectionReason();
            if (reason == null || reason.isBlank()) {
                throw new BadRequestException("A rejection reason is required");
            }
            TicketStatus prev = ticket.getStatus();
            ticket.setStatus(TicketStatus.REJECTED);
            ticket.setRejectionReason(reason.trim());
            ticket.setResolutionNotes(null);
            ticketRepository.save(ticket);
            recordHistory(ticket, prev, TicketStatus.REJECTED, user, reason.trim());
            return toResponse(ticket.getId(), true);
        }

        assertValidTransition(ticket.getStatus(), next);
        enforceTransitionActor(ticket, next, user);

        TicketStatus previous = ticket.getStatus();
        ticket.setStatus(next);
        if (next == TicketStatus.RESOLVED) {
            ticket.setResolutionNotes(blankToNull(request.resolutionNotes()));
            ticket.setRejectionReason(null);
        } else if (next == TicketStatus.CLOSED) {
            ticket.setRejectionReason(null);
        } else {
            ticket.setRejectionReason(null);
        }

        ticketRepository.save(ticket);
        String note = next == TicketStatus.RESOLVED ? blankToNull(request.resolutionNotes()) : null;
        recordHistory(ticket, previous, next, user, note);
        return toResponse(ticket.getId(), true);
    }

    public TicketResponse assign(Long id, AssignTicketRequest request, User actor) {
        Ticket ticket = loadDetailed(id);
        assertCanView(ticket, actor);

        User technician = userRepository.findById(request.technicianId())
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", request.technicianId()));

        if (technician.getRole() != Role.TECHNICIAN && technician.getRole() != Role.ADMIN) {
            throw new BadRequestException("Assignee must be a technician or admin account");
        }

        ticket.setAssignedTo(technician);
        ticketRepository.save(ticket);
        return toResponse(ticket.getId(), true);
    }

    public void delete(Long id, User user) {
        Ticket ticket = ticketRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Ticket", "id", id));

        boolean creatorOpen = isCreator(ticket, user) && ticket.getStatus() == TicketStatus.OPEN;
        if (!creatorOpen && user.getRole() != Role.ADMIN) {
            throw new ForbiddenException("You cannot delete this ticket");
        }

        ticketRepository.delete(ticket);
    }

    @Transactional(readOnly = true)
    public List<CommentResponse> listComments(Long ticketId, User user) {
        Ticket ticket = loadDetailed(ticketId);
        assertCanView(ticket, user);
        return commentRepository.findByTicketIdOrderByCreatedAtAsc(ticketId).stream()
                .map(this::toCommentResponse)
                .toList();
    }

    public CommentResponse addComment(Long ticketId, CommentRequest request, User author) {
        Ticket ticket = loadDetailed(ticketId);
        assertCanView(ticket, author);

        Comment comment = Comment.builder()
                .content(request.content().trim())
                .ticket(ticket)
                .author(author)
                .build();
        comment = commentRepository.save(comment);
        return toCommentResponse(comment);
    }

    public CommentResponse updateComment(Long ticketId, Long commentId, CommentRequest request, User user) {
        Ticket ticket = loadDetailed(ticketId);
        assertCanView(ticket, user);

        Comment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new ResourceNotFoundException("Comment", "id", commentId));
        if (!comment.getTicket().getId().equals(ticketId)) {
            throw new ResourceNotFoundException("Comment", "id", commentId);
        }
        if (!comment.getAuthor().getId().equals(user.getId())) {
            throw new ForbiddenException("You can only edit your own comments");
        }

        comment.setContent(request.content().trim());
        comment = commentRepository.save(comment);
        return toCommentResponse(comment);
    }

    public void deleteComment(Long ticketId, Long commentId, User user) {
        Ticket ticket = loadDetailed(ticketId);
        assertCanView(ticket, user);

        Comment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new ResourceNotFoundException("Comment", "id", commentId));
        if (!comment.getTicket().getId().equals(ticketId)) {
            throw new ResourceNotFoundException("Comment", "id", commentId);
        }
        boolean owner = comment.getAuthor().getId().equals(user.getId());
        if (!owner && user.getRole() != Role.ADMIN) {
            throw new ForbiddenException("Only the author or an admin can delete this comment");
        }

        commentRepository.delete(comment);
    }

    @Transactional(readOnly = true)
    public List<UserSummary> listTechnicians() {
        return userRepository.findByRole(Role.TECHNICIAN).stream()
                .map(this::toUserSummary)
                .toList();
    }

    private void recordHistory(Ticket ticket, TicketStatus from, TicketStatus to, User actor, String note) {
        TicketStatusHistory h = TicketStatusHistory.builder()
                .ticket(ticket)
                .fromStatus(from)
                .toStatus(to)
                .changedBy(actor)
                .note(note)
                .build();
        ticketStatusHistoryRepository.save(h);
    }

    private void assertValidTransition(TicketStatus current, TicketStatus next) {
        if (current == TicketStatus.REJECTED || current == TicketStatus.CLOSED) {
            throw new BadRequestException("This ticket is closed and cannot change status");
        }
        if (current == next) {
            return;
        }
        switch (current) {
            case OPEN -> {
                if (next != TicketStatus.IN_PROGRESS && next != TicketStatus.REJECTED) {
                    throw new BadRequestException("Invalid status transition from OPEN");
                }
            }
            case IN_PROGRESS -> {
                if (next != TicketStatus.RESOLVED) {
                    throw new BadRequestException("Invalid status transition from IN_PROGRESS");
                }
            }
            case RESOLVED -> {
                if (next != TicketStatus.CLOSED) {
                    throw new BadRequestException("Invalid status transition from RESOLVED");
                }
            }
            default -> throw new BadRequestException("Invalid status transition");
        }
    }

    private void enforceTransitionActor(Ticket ticket, TicketStatus next, User user) {
        if (ticket.getStatus() == next) {
            return;
        }
        switch (ticket.getStatus()) {
            case OPEN -> {
                if (next == TicketStatus.IN_PROGRESS && !isStaff(user)) {
                    throw new ForbiddenException("Only staff can start work on a ticket");
                }
            }
            case IN_PROGRESS -> {
                if (next == TicketStatus.RESOLVED) {
                    if (!(isStaff(user) || isAssignee(ticket, user))) {
                        throw new ForbiddenException("Only assigned staff or the assignee can resolve this ticket");
                    }
                }
            }
            case RESOLVED -> {
                if (next == TicketStatus.CLOSED) {
                    if (!(isCreator(ticket, user) || isAssignee(ticket, user)
                            || user.getRole() == Role.ADMIN || user.getRole() == Role.MANAGER)) {
                        throw new ForbiddenException("You cannot close this ticket");
                    }
                }
            }
            default -> {
            }
        }
    }

    private Ticket loadDetailed(Long id) {
        return ticketRepository.findDetailedById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Ticket", "id", id));
    }

    private TicketResponse toResponse(Long ticketId, boolean includeHistory) {
        Ticket ticket = ticketRepository.findDetailedById(ticketId)
                .orElseThrow(() -> new ResourceNotFoundException("Ticket", "id", ticketId));
        return toResponse(ticket, includeHistory);
    }

    private TicketResponse toResponse(Ticket t, boolean includeHistory) {
        List<StatusHistoryEntry> history = List.of();
        if (includeHistory) {
            history = ticketStatusHistoryRepository.findByTicketIdOrderByCreatedAtAsc(t.getId()).stream()
                    .map(this::toHistoryEntry)
                    .toList();
        }
        return new TicketResponse(
                t.getId(),
                t.getTitle(),
                t.getDescription(),
                t.getCategory(),
                t.getPriority(),
                t.getStatus(),
                toUserSummary(t.getCreatedBy()),
                t.getAssignedTo() != null ? toUserSummary(t.getAssignedTo()) : null,
                t.getFacility() != null
                        ? new FacilitySummary(t.getFacility().getId(), t.getFacility().getName(), t.getFacility().getLocation())
                        : null,
                t.getContactName(),
                t.getContactEmail(),
                t.getContactPhone(),
                t.getLocation(),
                t.getImageUrls() != null ? List.copyOf(t.getImageUrls()) : List.of(),
                t.getResolutionNotes(),
                t.getRejectionReason(),
                t.getCreatedAt(),
                t.getUpdatedAt(),
                history
        );
    }

    private StatusHistoryEntry toHistoryEntry(TicketStatusHistory h) {
        UserSummary u = h.getChangedBy() != null ? toUserSummary(h.getChangedBy()) : null;
        return new StatusHistoryEntry(
                h.getId(),
                h.getFromStatus(),
                h.getToStatus(),
                u,
                h.getNote(),
                h.getCreatedAt()
        );
    }

    private CommentResponse toCommentResponse(Comment c) {
        return new CommentResponse(
                c.getId(),
                c.getContent(),
                toUserSummary(c.getAuthor()),
                c.getCreatedAt(),
                c.getUpdatedAt()
        );
    }

    private UserSummary toUserSummary(User u) {
        return new UserSummary(u.getId(), u.getName(), u.getEmail(), u.getRole().name());
    }

    private void assertCanView(Ticket ticket, User user) {
        if (isStaff(user)) {
            return;
        }
        if (isCreator(ticket, user)) {
            return;
        }
        if (isAssignee(ticket, user)) {
            return;
        }
        throw new ForbiddenException("You cannot access this ticket");
    }

    private static boolean isStaff(User user) {
        Role r = user.getRole();
        return r == Role.ADMIN || r == Role.TECHNICIAN || r == Role.MANAGER;
    }

    private static boolean isCreator(Ticket ticket, User user) {
        return ticket.getCreatedBy().getId().equals(user.getId());
    }

    private static boolean isAssignee(Ticket ticket, User user) {
        return ticket.getAssignedTo() != null
                && ticket.getAssignedTo().getId().equals(user.getId());
    }

    private static String blankToNull(String s) {
        if (s == null) {
            return null;
        }
        String t = s.trim();
        return t.isEmpty() ? null : t;
    }
}
