package com.smartcampus.smart_campus_api.service;

import com.smartcampus.smart_campus_api.exception.BadRequestException;
import com.smartcampus.smart_campus_api.exception.ResourceNotFoundException;
import com.smartcampus.smart_campus_api.model.Comment;
import com.smartcampus.smart_campus_api.model.Ticket;
import com.smartcampus.smart_campus_api.model.User;
import com.smartcampus.smart_campus_api.repository.CommentRepository;
import com.smartcampus.smart_campus_api.repository.TicketRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * MODULE C — Comment business logic.
 * Handles CRUD operations for ticket comments.
 *
 * @author Member 3 (M3)
 */
@Service
public class CommentService {

    private final CommentRepository commentRepository;
    private final TicketRepository ticketRepository;

    public CommentService(CommentRepository commentRepository, TicketRepository ticketRepository) {
        this.commentRepository = commentRepository;
        this.ticketRepository = ticketRepository;
    }

    /** Get all comments for a ticket, ordered by createdAt ascending. */
    public List<Comment> getComments(Long ticketId) {
        return commentRepository.findByTicketIdOrderByCreatedAtAsc(ticketId);
    }

    /** Add a comment to a ticket. */
    @Transactional
    public Comment addComment(Long ticketId, String content, User user) {
        Ticket ticket = ticketRepository.findById(ticketId)
                .orElseThrow(() -> new ResourceNotFoundException("Ticket not found with id: " + ticketId));

        Comment comment = Comment.builder()
                .content(content)
                .ticket(ticket)
                .author(user)
                .build();

        return commentRepository.save(comment);
    }

    /** Update a comment. Only the author can update. */
    @Transactional
    public Comment updateComment(Long ticketId, Long commentId, String content, User user) {
        Comment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new ResourceNotFoundException("Comment not found with id: " + commentId));

        if (!comment.getTicket().getId().equals(ticketId)) {
            throw new BadRequestException("Comment does not belong to ticket " + ticketId);
        }

        if (!comment.getAuthor().getId().equals(user.getId())) {
            throw new BadRequestException("You can only edit your own comments");
        }

        comment.setContent(content);
        return commentRepository.save(comment);
    }

    /** Delete a comment. Only the author can delete. */
    @Transactional
    public void deleteComment(Long ticketId, Long commentId, User user) {
        Comment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new ResourceNotFoundException("Comment not found with id: " + commentId));

        if (!comment.getTicket().getId().equals(ticketId)) {
            throw new BadRequestException("Comment does not belong to ticket " + ticketId);
        }

        if (!comment.getAuthor().getId().equals(user.getId())) {
            throw new BadRequestException("You can only delete your own comments");
        }

        commentRepository.delete(comment);
    }
}
