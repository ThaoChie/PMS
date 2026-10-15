package com.pms.backend.dao;

import com.pms.backend.model.WorkflowTransition;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface WorkflowTransitionRepository extends JpaRepository<WorkflowTransition, Long> {
    List<WorkflowTransition> findByProjectId(Long projectId);
    List<WorkflowTransition> findByFromStatusId(Long fromStatusId);
    void deleteByProjectId(Long projectId);
}
