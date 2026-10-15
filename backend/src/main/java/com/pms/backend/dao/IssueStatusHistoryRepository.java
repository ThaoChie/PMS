package com.pms.backend.dao;

import com.pms.backend.model.IssueStatusHistory;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface IssueStatusHistoryRepository extends JpaRepository<IssueStatusHistory, Long> {
    List<IssueStatusHistory> findByIssueIdOrderByChangedAtAsc(Long issueId);
}
