package com.pms.backend.dao;

import com.pms.backend.model.AuditLog;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface AuditLogRepository extends JpaRepository<AuditLog, Long> {
    List<AuditLog> findByProjectIdOrderByCreatedAtDesc(Long projectId);
    Page<AuditLog> findByProjectIdOrderByCreatedAtDesc(Long projectId, Pageable pageable);

    @Query("SELECT a FROM AuditLog a WHERE a.projectId IN :projectIds ORDER BY a.createdAt DESC")
    List<AuditLog> findRecentActivitiesForProjects(@Param("projectIds") List<Long> projectIds, Pageable pageable);
}
