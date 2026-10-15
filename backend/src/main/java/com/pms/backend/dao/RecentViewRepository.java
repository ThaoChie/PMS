package com.pms.backend.dao;

import com.pms.backend.model.RecentView;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface RecentViewRepository extends JpaRepository<RecentView, Long> {
    Optional<RecentView> findByUserIdAndIssueId(Long userId, Long issueId);

    @Query("SELECT r FROM RecentView r JOIN FETCH r.issue i LEFT JOIN FETCH i.status LEFT JOIN FETCH i.assignee WHERE r.user.id = :userId ORDER BY r.viewedAt DESC")
    List<RecentView> findTop20ByUserIdOrderByViewedAtDesc(@Param("userId") Long userId);
}
