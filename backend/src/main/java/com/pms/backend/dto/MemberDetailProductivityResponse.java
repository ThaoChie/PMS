package com.pms.backend.dto;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

public class MemberDetailProductivityResponse {
    private Long projectId;
    private Long userId;
    private LocalDate from;
    private LocalDate to;
    private MemberProductivityDto member;
    private List<MemberProductivityIssueDto> issues = new ArrayList<>();
    private List<MemberProductivityWorklogDto> worklogs = new ArrayList<>();
    private int totalIssues;
    private int totalWorklogs;
    private Double totalLoggedHours;

    public MemberDetailProductivityResponse() {}

    public Long getProjectId() { return projectId; }
    public void setProjectId(Long projectId) { this.projectId = projectId; }

    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }

    public LocalDate getFrom() { return from; }
    public void setFrom(LocalDate from) { this.from = from; }

    public LocalDate getTo() { return to; }
    public void setTo(LocalDate to) { this.to = to; }

    public MemberProductivityDto getMember() { return member; }
    public void setMember(MemberProductivityDto member) { this.member = member; }

    public List<MemberProductivityIssueDto> getIssues() { return issues; }
    public void setIssues(List<MemberProductivityIssueDto> issues) { this.issues = issues; }

    public List<MemberProductivityWorklogDto> getWorklogs() { return worklogs; }
    public void setWorklogs(List<MemberProductivityWorklogDto> worklogs) { this.worklogs = worklogs; }

    public int getTotalIssues() { return totalIssues; }
    public void setTotalIssues(int totalIssues) { this.totalIssues = totalIssues; }

    public int getTotalWorklogs() { return totalWorklogs; }
    public void setTotalWorklogs(int totalWorklogs) { this.totalWorklogs = totalWorklogs; }

    public Double getTotalLoggedHours() { return totalLoggedHours; }
    public void setTotalLoggedHours(Double totalLoggedHours) { this.totalLoggedHours = totalLoggedHours; }
}
