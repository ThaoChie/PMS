package com.pms.backend.dto;

import java.util.ArrayList;
import java.util.List;

public class WorkflowResponse {
    private List<WorkflowStatusDto> statuses = new ArrayList<>();
    private List<WorkflowTransitionDto> transitions = new ArrayList<>();
    private List<String> warnings = new ArrayList<>();

    public WorkflowResponse() {}

    public WorkflowResponse(List<WorkflowStatusDto> statuses, List<WorkflowTransitionDto> transitions, List<String> warnings) {
        this.statuses = statuses;
        this.transitions = transitions;
        this.warnings = warnings;
    }

    public List<WorkflowStatusDto> getStatuses() { return statuses; }
    public void setStatuses(List<WorkflowStatusDto> statuses) { this.statuses = statuses; }

    public List<WorkflowTransitionDto> getTransitions() { return transitions; }
    public void setTransitions(List<WorkflowTransitionDto> transitions) { this.transitions = transitions; }

    public List<String> getWarnings() { return warnings; }
    public void setWarnings(List<String> warnings) { this.warnings = warnings; }
}
