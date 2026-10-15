package com.pms.backend.dao;

import com.pms.backend.model.Comment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface CommentRepository extends JpaRepository<Comment, Long> {
    List<Comment> findByIssueId(Long issueId);

    List<Comment> findByIssueIdOrderByCreatedAtAsc(Long issueId);

    @Query("SELECT c FROM Comment c LEFT JOIN FETCH c.user LEFT JOIN FETCH c.mentions WHERE c.issue.issueKey = :issueKey ORDER BY c.createdAt ASC")
    List<Comment> findByIssueKeyOrderByCreatedAtAsc(@Param("issueKey") String issueKey);
}
