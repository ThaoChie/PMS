package com.pms.backend.dao;

import com.pms.backend.model.IssueWatcher;
import com.pms.backend.model.IssueWatcherId;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface IssueWatcherRepository extends JpaRepository<IssueWatcher, IssueWatcherId> {
    boolean existsByIssueIdAndUserId(Long issueId, Long userId);

    void deleteByIssueIdAndUserId(Long issueId, Long userId);

    List<IssueWatcher> findByIssueId(Long issueId);

    @Query("SELECT w FROM IssueWatcher w JOIN FETCH w.issue WHERE w.user.id = :userId")
    List<IssueWatcher> findByUserId(@Param("userId") Long userId);
}
