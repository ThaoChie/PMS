package com.pms.backend.dto;

import jakarta.validation.constraints.NotNull;
import java.util.Map;

public class TransitionRequest {

    @NotNull(message = "Transition ID is required")
    private Long transitionId;

    private Map<String, Object> fields;

    private String comment;

    private Boolean sendEmail;

    public Long getTransitionId() { return transitionId; }
    public void setTransitionId(Long transitionId) { this.transitionId = transitionId; }

    public Map<String, Object> getFields() { return fields; }
    public void setFields(Map<String, Object> fields) { this.fields = fields; }

    public String getComment() { return comment; }
    public void setComment(String comment) { this.comment = comment; }

    public Boolean getSendEmail() { return sendEmail; }
    public void setSendEmail(Boolean sendEmail) { this.sendEmail = sendEmail; }
}
