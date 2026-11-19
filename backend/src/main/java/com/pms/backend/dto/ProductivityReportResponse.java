package com.pms.backend.dto;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

public class ProductivityReportResponse {

    private Long projectId;
    private LocalDate from;
    private LocalDate to;
    private String scope; // "MEMBER_DETAIL" or "PROJECT_SUMMARY"

    private int totalAssigned;
    private int totalCompleted;
    private int totalInProgress;
    private int totalTodo;
    private int totalOverdue;
    private Double overallOnTimeRate;

    private Double totalEstimatedHours;
    private Double totalLoggedHours;
    private Double avgResolutionTimeHours;

    private int totalBugsAssigned;
    private int totalBugsResolved;
    private int totalBugsReopened;

    private Integer page;
    private Integer size;
    private Integer totalMembers;
    private Integer totalPages;

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

    public int getTotalAssigned() { return totalAssigned; }
    public void setTotalAssigned(int totalAssigned) { this.totalAssigned = totalAssigned; }

    public int getTotalCompleted() { return totalCompleted; }
    public void setTotalCompleted(int totalCompleted) { this.totalCompleted = totalCompleted; }

    public int getTotalInProgress() { return totalInProgress; }
    public void setTotalInProgress(int totalInProgress) { this.totalInProgress = totalInProgress; }

    public int getTotalTodo() { return totalTodo; }
    public void setTotalTodo(int totalTodo) { this.totalTodo = totalTodo; }

    public int getTotalOverdue() { return totalOverdue; }
    public void setTotalOverdue(int totalOverdue) { this.totalOverdue = totalOverdue; }

    public Double getOverallOnTimeRate() { return overallOnTimeRate; }
    public void setOverallOnTimeRate(Double overallOnTimeRate) { this.overallOnTimeRate = overallOnTimeRate; }

    public Double getTotalEstimatedHours() { return totalEstimatedHours; }
    public void setTotalEstimatedHours(Double totalEstimatedHours) { this.totalEstimatedHours = totalEstimatedHours; }

    public Double getTotalLoggedHours() { return totalLoggedHours; }
    public void setTotalLoggedHours(Double totalLoggedHours) { this.totalLoggedHours = totalLoggedHours; }

    public Double getAvgResolutionTimeHours() { return avgResolutionTimeHours; }
    public void setAvgResolutionTimeHours(Double avgResolutionTimeHours) { this.avgResolutionTimeHours = avgResolutionTimeHours; }

    public int getTotalBugsAssigned() { return totalBugsAssigned; }
    public void setTotalBugsAssigned(int totalBugsAssigned) { this.totalBugsAssigned = totalBugsAssigned; }

    public int getTotalBugsResolved() { return totalBugsResolved; }
    public void setTotalBugsResolved(int totalBugsResolved) { this.totalBugsResolved = totalBugsResolved; }

    public int getTotalBugsReopened() { return totalBugsReopened; }
    public void setTotalBugsReopened(int totalBugsReopened) { this.totalBugsReopened = totalBugsReopened; }

    public Integer getPage() { return page; }
    public void setPage(Integer page) { this.page = page; }

    public Integer getSize() { return size; }
    public void setSize(Integer size) { this.size = size; }

    public Integer getTotalMembers() { return totalMembers; }
    public void setTotalMembers(Integer totalMembers) { this.totalMembers = totalMembers; }

    public Integer getTotalPages() { return totalPages; }
    public void setTotalPages(Integer totalPages) { this.totalPages = totalPages; }

    public List<MemberProductivityDto> getMembers() { return members; }
    public void setMembers(List<MemberProductivityDto> members) { this.members = members; }

    public List<ProductivityPointDto> getPoints() { return points; }
    public void setPoints(List<ProductivityPointDto> points) { this.points = points; }
}
