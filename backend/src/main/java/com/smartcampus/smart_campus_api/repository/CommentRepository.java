package com.smartcampus.smart_campus_api.repository;

import com.smartcampus.smart_campus_api.model.Comment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CommentRepository extends JpaRepository<Comment, Long> {

    @Query("""
            SELECT c FROM Comment c JOIN FETCH c.author
            WHERE c.ticket.id = :ticketId
            ORDER BY c.createdAt ASC
            """)
    List<Comment> findByTicketIdOrderByCreatedAtAsc(@Param("ticketId") Long ticketId);

    List<Comment> findByAuthorId(Long authorId);
}
