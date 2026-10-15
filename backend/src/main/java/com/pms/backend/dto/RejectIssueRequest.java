package com.pms.backend.dto;

import jakarta.validation.constraints.NotBlank;

public class RejectIssueRequest {

    @NotBlank(message = "Reject reason is mandatory")
    private String reason;

    public String getReason() { return reason; }
    public void setReason(String reason) { this.reason = reason; }
}
