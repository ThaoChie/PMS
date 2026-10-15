package com.pms.backend.dto;

import jakarta.validation.constraints.NotEmpty;
import java.util.List;

public class SaveWorkflowRequest {

    @NotEmpty(message = "Statuses list cannot be empty")
    private List<WorkflowStatusDto> statuses;

    private List<WorkflowTransitionDto> transitions;

    public List<WorkflowStatusDto> getStatuses() { return statuses; }
    public void setStatuses(List<WorkflowStatusDto> statuses) { this.statuses = statuses; }

    public List<WorkflowTransitionDto> getTransitions() { return transitions; }
    public void setTransitions(List<WorkflowTransitionDto> transitions) { this.transitions = transitions; }
}
