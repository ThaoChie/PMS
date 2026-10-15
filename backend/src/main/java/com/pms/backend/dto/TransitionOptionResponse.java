package com.pms.backend.dto;

import com.pms.backend.enu.TransitionType;
import com.pms.backend.model.WorkflowTransition;

public class TransitionOptionResponse {
    private Long id;
    private String name;
    private Long toStatusId;
    private String toStatusName;
    private String toStatusCategory;
    private TransitionType type;
    private String requiredFields;

    public static TransitionOptionResponse from(WorkflowTransition t) {
        if (t == null) return null;
        TransitionOptionResponse res = new TransitionOptionResponse();
        res.setId(t.getId());
        res.setName(t.getName());
        if (t.getToStatus() != null) {
            res.setToStatusId(t.getToStatus().getId());
            res.setToStatusName(t.getToStatus().getName());
            res.setToStatusCategory(t.getToStatus().getCategory() != null ? t.getToStatus().getCategory().name() : "TODO");
        }
        res.setType(t.getType());
        res.setRequiredFields(t.getRequiredFields());
        return res;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public Long getToStatusId() { return toStatusId; }
    public void setToStatusId(Long toStatusId) { this.toStatusId = toStatusId; }

    public String getToStatusName() { return toStatusName; }
    public void setToStatusName(String toStatusName) { this.toStatusName = toStatusName; }

    public String getToStatusCategory() { return toStatusCategory; }
    public void setToStatusCategory(String toStatusCategory) { this.toStatusCategory = toStatusCategory; }

    public TransitionType getType() { return type; }
    public void setType(TransitionType type) { this.type = type; }

    public String getRequiredFields() { return requiredFields; }
    public void setRequiredFields(String requiredFields) { this.requiredFields = requiredFields; }
}
