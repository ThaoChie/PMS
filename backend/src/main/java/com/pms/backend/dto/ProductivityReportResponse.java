package com.pms.backend.dto;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

public class ProductivityReportResponse {

    private Long projectId;
    private LocalDate from;
    private LocalDate to;
    private String scope; // "MEMBER_DETAIL" or "PROJECT_SUMMARY"
    private int totalCompleted;
    private int totalInProgress;
    private Double avgResolutionTimeHours;
    private Double totalLoggedHours;
    private List<MemberProductivityDto> members = new ArrayList<>();
    private List<ProductivityPointDto> points = new ArrayList<>();

    public ProductivityReportResponse() {}

    public ProductivityReportResponse(Long projectId, LocalDate from, LocalDate to, String scope,
                                      int totalCompleted, int totalInProgress,
                                      Double avgResolutionTimeHours, Double totalLoggedHours,
                                      List<MemberProductivityDto> members, List<ProductivityPointDto> points) {
        this.projectId = projectId;
        this.from = from;
        this.to = to;
        this.scope = scope;
        this.totalCompleted = totalCompleted;
        this.totalInProgress = totalInProgress;
        this.avgResolutionTimeHours = avgResolutionTimeHours;
        this.totalLoggedHours = totalLoggedHours;
        this.members = members != null ? members : new ArrayList<>();
        this.points = points != null ? points : new ArrayList<>();
    }

    public Long getProjectId() { return projectId; }
    public void setProjectId(Long projectId) { this.projectId = projectId; }

    public LocalDate getFrom() { return from; }
    public void setFrom(LocalDate from) { this.from = from; }

    public LocalDate getTo() { return to; }
    public void setTo(LocalDate to) { this.to = to; }

    public String getScope() { return scope; }
    public void setScope(String scope) { this.scope = scope; }

    public int getTotalCompleted() { return totalCompleted; }
    public void setTotalCompleted(int totalCompleted) { this.totalCompleted = totalCompleted; }

    public int getTotalInProgress() { return totalInProgress; }
    public void setTotalInProgress(int totalInProgress) { this.totalInProgress = totalInProgress; }

    public Double getAvgResolutionTimeHours() { return avgResolutionTimeHours; }
    public void setAvgResolutionTimeHours(Double avgResolutionTimeHours) { this.avgResolutionTimeHours = avgResolutionTimeHours; }

    public Double getTotalLoggedHours() { return totalLoggedHours; }
    public void setTotalLoggedHours(Double totalLoggedHours) { this.totalLoggedHours = totalLoggedHours; }

    public List<MemberProductivityDto> getMembers() { return members; }
    public void setMembers(List<MemberProductivityDto> members) { this.members = members; }

    public List<ProductivityPointDto> getPoints() { return points; }
    public void setPoints(List<ProductivityPointDto> points) { this.points = points; }
}
