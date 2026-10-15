package com.pms.backend.dto;

public class BugReportItemDto {
    private String priority;
    private String severity;
    private int resolved;
    private int unresolved;
    private int count;

    public BugReportItemDto() {}

    public BugReportItemDto(String priority, int resolved, int unresolved) {
        this.priority = priority;
        this.severity = priority;
        this.resolved = resolved;
        this.unresolved = unresolved;
        this.count = resolved + unresolved;
    }

    public String getPriority() { return priority; }
    public void setPriority(String priority) { this.priority = priority; this.severity = priority; }
    public String getSeverity() { return severity; }
    public void setSeverity(String severity) { this.severity = severity; this.priority = severity; }
    public int getResolved() { return resolved; }
    public void setResolved(int resolved) { this.resolved = resolved; }
    public int getUnresolved() { return unresolved; }
    public void setUnresolved(int unresolved) { this.unresolved = unresolved; }
    public int getCount() { return count; }
    public void setCount(int count) { this.count = count; }
}
