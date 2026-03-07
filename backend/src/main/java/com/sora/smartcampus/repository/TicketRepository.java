package com.sora.smartcampus.repository;

import com.sora.smartcampus.model.Ticket;
import com.sora.smartcampus.model.TicketPriority;
import com.sora.smartcampus.model.TicketStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TicketRepository extends JpaRepository<Ticket, Long> {

    List<Ticket> findByCreatedById(Long userId);

    List<Ticket> findByAssignedToId(Long technicianId);

    List<Ticket> findByStatus(TicketStatus status);

    List<Ticket> findByPriority(TicketPriority priority);

    List<Ticket> findByStatusAndPriority(TicketStatus status, TicketPriority priority);
}
