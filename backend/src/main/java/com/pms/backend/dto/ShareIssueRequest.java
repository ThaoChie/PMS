package com.pms.backend.dto;

import java.util.List;

public class ShareIssueRequest {
    private List<String> recipients;
    private String note;

    public ShareIssueRequest() {}

    public List<String> getRecipients() { return recipients; }
    public void setRecipients(List<String> recipients) { this.recipients = recipients; }

    public String getNote() { return note; }
    public void setNote(String note) { this.note = note; }
}
