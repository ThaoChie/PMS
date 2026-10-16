package com.pms.backend.dto;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

public class BugReportResponse {

    private Long projectId;
    private LocalDate from;
    private LocalDate to;
    private int totalBugs;
    private int resolvedBugs;
    private int unresolvedBugs;
    private double resolutionRate;
    private Double avgClosingTimeHours;
    private List<BugReportItemDto> byPriority = new ArrayList<>();
    private Map<String, Integer> openBugsByPriority = new LinkedHashMap<>();

    public BugReportResponse() {}

    public BugReportResponse(Long projectId, LocalDate from, LocalDate to,
                             int totalBugs, int resolvedBugs, int unresolvedBugs,
                             double resolutionRate, Double avgClosingTimeHours,
                             List<BugReportItemDto> byPriority,
                             Map<String, Integer> openBugsByPriority) {
        this.projectId = projectId;
        this.from = from;
        this.to = to;
        this.totalBugs = totalBugs;
        this.resolvedBugs = resolvedBugs;
        this.unresolvedBugs = unresolvedBugs;
        this.resolutionRate = resolutionRate;
        this.avgClosingTimeHours = avgClosingTimeHours;
        this.byPriority = byPriority != null ? byPriority : new ArrayList<>();
        this.openBugsByPriority = openBugsByPriority != null ? openBugsByPriority : new LinkedHashMap<>();
    }

    public Long getProjectId() { return projectId; }
    public void setProjectId(Long projectId) { this.projectId = projectId; }

    public LocalDate getFrom() { return from; }
    public void setFrom(LocalDate from) { this.from = from; }

    public LocalDate getTo() { return to; }
    public void setTo(LocalDate to) { this.to = to; }

    public int getTotalBugs() { return totalBugs; }
    public void setTotalBugs(int totalBugs) { this.totalBugs = totalBugs; }

    public int getResolvedBugs() { return resolvedBugs; }
    public void setResolvedBugs(int resolvedBugs) { this.resolvedBugs = resolvedBugs; }

    public int getUnresolvedBugs() { return unresolvedBugs; }
    public void setUnresolvedBugs(int unresolvedBugs) { this.unresolvedBugs = unresolvedBugs; }

    public double getResolutionRate() { return resolutionRate; }
    public void setResolutionRate(double resolutionRate) { this.resolutionRate = resolutionRate; }

    public Double getAvgClosingTimeHours() { return avgClosingTimeHours; }
    public void setAvgClosingTimeHours(Double avgClosingTimeHours) { this.avgClosingTimeHours = avgClosingTimeHours; }

    public List<BugReportItemDto> getByPriority() { return byPriority; }
    public void setByPriority(List<BugReportItemDto> byPriority) { this.byPriority = byPriority; }

    public Map<String, Integer> getOpenBugsByPriority() { return openBugsByPriority; }
    public void setOpenBugsByPriority(Map<String, Integer> openBugsByPriority) { this.openBugsByPriority = openBugsByPriority; }
}
