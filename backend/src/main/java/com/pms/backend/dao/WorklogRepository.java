package com.pms.backend.dao;

import com.pms.backend.model.Worklog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface WorklogRepository extends JpaRepository<Worklog, Long> {
    List<Worklog> findByIssueId(Long issueId);

    List<Worklog> findByIssueIdOrderByWorkDateDescCreatedAtDesc(Long issueId);

    @Query("SELECT w FROM Worklog w LEFT JOIN FETCH w.user WHERE w.issue.issueKey = :issueKey ORDER BY w.workDate DESC, w.createdAt DESC")
    List<Worklog> findByIssueKeyOrderByWorkDateDesc(@Param("issueKey") String issueKey);
}
