package com.pms.backend.dto;

import java.util.ArrayList;
import java.util.List;

public class ShareIssueResponse {
    private List<String> warnings = new ArrayList<>();

    public ShareIssueResponse() {}

    public ShareIssueResponse(List<String> warnings) {
        this.warnings = warnings;
    }

    public List<String> getWarnings() { return warnings; }
    public void setWarnings(List<String> warnings) { this.warnings = warnings; }
}
