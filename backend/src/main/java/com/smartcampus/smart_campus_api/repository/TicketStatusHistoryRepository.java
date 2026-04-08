package com.smartcampus.smart_campus_api.repository;

import com.smartcampus.smart_campus_api.model.TicketStatusHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TicketStatusHistoryRepository extends JpaRepository<TicketStatusHistory, Long> {

    List<TicketStatusHistory> findByTicketIdOrderByCreatedAtAsc(Long ticketId);
}
