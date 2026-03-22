package com.smartcampus.smart_campus_api.service;

import com.smartcampus.smart_campus_api.dto.CreateTicketRequest;
import com.smartcampus.smart_campus_api.exception.BadRequestException;
import com.smartcampus.smart_campus_api.exception.ResourceNotFoundException;
import com.smartcampus.smart_campus_api.model.*;
import com.smartcampus.smart_campus_api.repository.TicketRepository;
import com.smartcampus.smart_campus_api.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * MODULE C — Ticket business logic.
 * Handles CRUD operations for maintenance/incident tickets.
 *
 * @author Member 3 (M3)
 */
@Service
public class TicketService {

    private final TicketRepository ticketRepository;
    private final UserRepository userRepository;

    public TicketService(TicketRepository ticketRepository, UserRepository userRepository) {
        this.ticketRepository = ticketRepository;
        this.userRepository = userRepository;
    }

    /** Get all tickets. */
    public List<Ticket> getAll() {
        return ticketRepository.findAll();
    }

    /** Get a ticket by ID or throw 404. */
    public Ticket getById(Long id) {
        return ticketRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Ticket not found with id: " + id));
    }

    /** Get tickets created by the given user. */
    public List<Ticket> getMyTickets(User user) {
        return ticketRepository.findByCreatedById(user.getId());
    }

    /** Create a new ticket. Sets createdBy and default status OPEN. */
    @Transactional
    public Ticket create(CreateTicketRequest request, User user) {
        Ticket ticket = Ticket.builder()
                .title(request.title())
                .description(request.description())
                .category(request.category())
                .priority(request.priority())
                .location(request.location())
                .contactPhone(request.contactPhone())
                .imageUrls(request.imageUrls() != null ? request.imageUrls() : List.of())
                .status(TicketStatus.OPEN)
                .createdBy(user)
                .build();

        return ticketRepository.save(ticket);
    }

    /**
     * Update a ticket. Only the creator can update.
     * Updates: title, description, category, priority, location, contactPhone, imageUrls.
     */
    @Transactional
    public Ticket update(Long id, CreateTicketRequest updated, User user) {
        Ticket ticket = getById(id);

        if (!ticket.getCreatedBy().getId().equals(user.getId())) {
            throw new BadRequestException("You can only update your own tickets");
        }

        ticket.setTitle(updated.title());
        ticket.setDescription(updated.description());
        ticket.setCategory(updated.category());
        ticket.setPriority(updated.priority());
        ticket.setLocation(updated.location());
        ticket.setContactPhone(updated.contactPhone());
        if (updated.imageUrls() != null) {
            ticket.setImageUrls(updated.imageUrls());
        }

        return ticketRepository.save(ticket);
    }

    /** Delete a ticket. Only the creator can delete. */
    @Transactional
    public void delete(Long id, User user) {
        Ticket ticket = getById(id);

        if (!ticket.getCreatedBy().getId().equals(user.getId())) {
            throw new BadRequestException("You can only delete your own tickets");
        }

        ticketRepository.delete(ticket);
    }

    /** Update ticket status. */
    @Transactional
    public Ticket updateStatus(Long id, String statusStr) {
        Ticket ticket = getById(id);

        try {
            TicketStatus status = TicketStatus.valueOf(statusStr);
            ticket.setStatus(status);
        } catch (IllegalArgumentException e) {
            throw new BadRequestException("Invalid status: " + statusStr);
        }

        return ticketRepository.save(ticket);
    }

    /** Assign a ticket to a technician and set status to IN_PROGRESS. */
    @Transactional
    public Ticket assign(Long id, Long technicianId) {
        Ticket ticket = getById(id);

        User technician = userRepository.findById(technicianId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + technicianId));

        ticket.setAssignedTo(technician);
        ticket.setStatus(TicketStatus.IN_PROGRESS);

        return ticketRepository.save(ticket);
    }
}
