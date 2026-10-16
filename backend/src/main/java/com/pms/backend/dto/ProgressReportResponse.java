package com.pms.backend.dto;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

public class ProgressReportResponse {

    private Long projectId;
    private LocalDate from;
    private LocalDate to;
    private String metric; // "issues" | "hours"
    private boolean hasEnoughData;
    private double totalScope;
    private double currentRemaining;
    private double currentCompleted;
    private boolean isAtRisk;
    private List<ProgressPointDto> series = new ArrayList<>();

    public ProgressReportResponse() {}

    public ProgressReportResponse(Long projectId, LocalDate from, LocalDate to, String metric,
                                  boolean hasEnoughData, double totalScope, double currentRemaining,
                                  double currentCompleted, boolean isAtRisk, List<ProgressPointDto> series) {
        this.projectId = projectId;
        this.from = from;
        this.to = to;
        this.metric = metric;
        this.hasEnoughData = hasEnoughData;
        this.totalScope = totalScope;
        this.currentRemaining = currentRemaining;
        this.currentCompleted = currentCompleted;
        this.isAtRisk = isAtRisk;
        this.series = series != null ? series : new ArrayList<>();
    }

    public Long getProjectId() { return projectId; }
    public void setProjectId(Long projectId) { this.projectId = projectId; }

    public LocalDate getFrom() { return from; }
    public void setFrom(LocalDate from) { this.from = from; }

    public LocalDate getTo() { return to; }
    public void setTo(LocalDate to) { this.to = to; }

    public String getMetric() { return metric; }
    public void setMetric(String metric) { this.metric = metric; }

    public boolean isHasEnoughData() { return hasEnoughData; }
    public void setHasEnoughData(boolean hasEnoughData) { this.hasEnoughData = hasEnoughData; }

    public double getTotalScope() { return totalScope; }
    public void setTotalScope(double totalScope) { this.totalScope = totalScope; }

    public double getCurrentRemaining() { return currentRemaining; }
    public void setCurrentRemaining(double currentRemaining) { this.currentRemaining = currentRemaining; }

    public double getCurrentCompleted() { return currentCompleted; }
    public void setCurrentCompleted(double currentCompleted) { this.currentCompleted = currentCompleted; }

    public boolean isAtRisk() { return isAtRisk; }
    public void setAtRisk(boolean atRisk) { isAtRisk = atRisk; }

    public List<ProgressPointDto> getSeries() { return series; }
    public void setSeries(List<ProgressPointDto> series) { this.series = series; }
}
