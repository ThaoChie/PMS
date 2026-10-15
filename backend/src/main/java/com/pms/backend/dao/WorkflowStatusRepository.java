package com.pms.backend.dao;

import com.pms.backend.model.WorkflowStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface WorkflowStatusRepository extends JpaRepository<WorkflowStatus, Long> {
    List<WorkflowStatus> findByProjectIdOrderByPositionAsc(Long projectId);
    Optional<WorkflowStatus> findByProjectIdAndIsInitialTrue(Long projectId);
    Optional<WorkflowStatus> findByProjectIdAndName(Long projectId, String name);
    void deleteByProjectId(Long projectId);
}
