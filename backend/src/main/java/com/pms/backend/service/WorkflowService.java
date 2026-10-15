package com.pms.backend.service;

import com.pms.backend.dao.WorkflowTransitionRepository;
import com.pms.backend.model.WorkflowTransition;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
public class WorkflowService {

    private final WorkflowTransitionRepository transitionRepository;

    public WorkflowService(WorkflowTransitionRepository transitionRepository) {
        this.transitionRepository = transitionRepository;
    }

    public boolean isValidTransition(Long fromStatusId, Long toStatusId) {
        List<WorkflowTransition> allowedTransitions = transitionRepository.findByFromStatusId(fromStatusId);
        return allowedTransitions.stream().anyMatch(t -> t.getToStatus().getId().equals(toStatusId));
    }
}
