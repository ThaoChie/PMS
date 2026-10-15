package com.pms.backend.dao;

import com.pms.backend.model.Issue;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface IssueRepository extends JpaRepository<Issue, Long> {
    Optional<Issue> findByIssueKey(String key);
    List<Issue> findByProjectId(Long projectId);
}
