package com.pms.backend.dto;

import com.pms.backend.enu.TransitionType;
import com.pms.backend.model.WorkflowTransition;

public class WorkflowTransitionDto {
    private Long id;
    private String name;
    private Long fromStatusId;
    private Long toStatusId;
    private String from; // Status name support
    private String to;   // Status name support
    private TransitionType type;
    private Boolean isApprovalStep;
    private String requiredFields;
    private String requiresField;

    public static WorkflowTransitionDto from(WorkflowTransition t) {
        if (t == null) return null;
        WorkflowTransitionDto dto = new WorkflowTransitionDto();
        dto.setId(t.getId());
        dto.setName(t.getName());
        if (t.getFromStatus() != null) {
            dto.setFromStatusId(t.getFromStatus().getId());
            dto.setFrom(t.getFromStatus().getName());
        }
        if (t.getToStatus() != null) {
            dto.setToStatusId(t.getToStatus().getId());
            dto.setTo(t.getToStatus().getName());
        }
        dto.setType(t.getType());
        dto.setIsApprovalStep(t.getType() == TransitionType.APPROVE || t.getType() == TransitionType.REJECT);
        dto.setRequiredFields(t.getRequiredFields());
        dto.setRequiresField(t.getRequiredFields());
        return dto;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public Long getFromStatusId() { return fromStatusId; }
    public void setFromStatusId(Long fromStatusId) { this.fromStatusId = fromStatusId; }

    public Long getToStatusId() { return toStatusId; }
    public void setToStatusId(Long toStatusId) { this.toStatusId = toStatusId; }

    public String getFrom() { return from; }
    public void setFrom(String from) { this.from = from; }

    public String getTo() { return to; }
    public void setTo(String to) { this.to = to; }

    public TransitionType getType() { return type; }
    public void setType(TransitionType type) { this.type = type; }

    public Boolean getIsApprovalStep() { return isApprovalStep; }
    public void setIsApprovalStep(Boolean isApprovalStep) { this.isApprovalStep = isApprovalStep; }

    public String getRequiredFields() { return requiredFields; }
    public void setRequiredFields(String requiredFields) { this.requiredFields = requiredFields; }

    public String getRequiresField() { return requiresField; }
    public void setRequiresField(String requiresField) { this.requiresField = requiresField; }
}
