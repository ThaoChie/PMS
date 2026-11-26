package com.pms.backend.dto;

import jakarta.validation.constraints.NotBlank;

public class RejectIssueRequest {

    @NotBlank(message = "Reject reason is mandatory")
    private String reason;

    private Boolean sendEmail;

    public String getReason() { return reason; }
    public void setReason(String reason) { this.reason = reason; }

    public Boolean getSendEmail() { return sendEmail; }
    public void setSendEmail(Boolean sendEmail) { this.sendEmail = sendEmail; }
}
