package com.smartcampus.smart_campus_api.repository;

import com.smartcampus.smart_campus_api.model.Ticket;
import com.smartcampus.smart_campus_api.model.TicketPriority;
import com.smartcampus.smart_campus_api.model.TicketStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface TicketRepository extends JpaRepository<Ticket, Long> {

    @Query("""
            SELECT DISTINCT t FROM Ticket t
            JOIN FETCH t.createdBy
            LEFT JOIN FETCH t.assignedTo
            LEFT JOIN FETCH t.facility
            WHERE t.id = :id
            """)
    Optional<Ticket> findDetailedById(@Param("id") Long id);

    @Query("""
            SELECT DISTINCT t FROM Ticket t
            JOIN FETCH t.createdBy
            LEFT JOIN FETCH t.assignedTo
            LEFT JOIN FETCH t.facility
            WHERE t.createdBy.id = :userId
            ORDER BY t.createdAt DESC
            """)
    List<Ticket> findMineWithDetails(@Param("userId") Long userId);

    @Query("""
            SELECT DISTINCT t FROM Ticket t
            JOIN FETCH t.createdBy
            LEFT JOIN FETCH t.assignedTo
            LEFT JOIN FETCH t.facility
            ORDER BY t.createdAt DESC
            """)
    List<Ticket> findAllWithDetails();

    @Query("""
            SELECT DISTINCT t FROM Ticket t
            JOIN FETCH t.createdBy
            LEFT JOIN FETCH t.assignedTo
            LEFT JOIN FETCH t.facility
            WHERE t.assignedTo.id = :technicianId
            ORDER BY t.createdAt DESC
            """)
    List<Ticket> findAssignedWithDetails(@Param("technicianId") Long technicianId);

    List<Ticket> findByCreatedById(Long userId);

    List<Ticket> findByAssignedToId(Long technicianId);

    List<Ticket> findByStatus(TicketStatus status);

    List<Ticket> findByPriority(TicketPriority priority);

    List<Ticket> findByStatusAndPriority(TicketStatus status, TicketPriority priority);
}
