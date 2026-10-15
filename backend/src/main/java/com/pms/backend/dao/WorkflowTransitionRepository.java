package com.pms.backend.dao;

import com.pms.backend.model.WorkflowTransition;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface WorkflowTransitionRepository extends JpaRepository<WorkflowTransition, Long> {
    List<WorkflowTransition> findByProjectId(Long projectId);
    List<WorkflowTransition> findByProjectIdOrderByCreatedAtAsc(Long projectId);
    List<WorkflowTransition> findByFromStatusId(Long fromStatusId);
    List<WorkflowTransition> findByFromStatusIdAndProjectId(Long fromStatusId, Long projectId);
    void deleteByProjectId(Long projectId);
    void deleteByFromStatusIdOrToStatusId(Long fromStatusId, Long toStatusId);
}
