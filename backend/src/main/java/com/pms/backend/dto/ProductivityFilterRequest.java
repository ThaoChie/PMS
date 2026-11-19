package com.pms.backend.dto;

import org.springframework.format.annotation.DateTimeFormat;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

public class ProductivityFilterRequest {

    @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
    private LocalDate from;

    @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
    private LocalDate to;

    private List<Long> memberIds = new ArrayList<>();
    private List<String> roles = new ArrayList<>();
    private List<String> issueTypes = new ArrayList<>();
    private List<String> priorities = new ArrayList<>();
    private List<String> statuses = new ArrayList<>();
    private Long sprintId;
    private Boolean overdueOnly;
    private String sort;
    private Integer page;
    private Integer size;

    public ProductivityFilterRequest() {}

    public LocalDate getFrom() { return from; }
    public void setFrom(LocalDate from) { this.from = from; }

    public LocalDate getTo() { return to; }
    public void setTo(LocalDate to) { this.to = to; }

    public List<Long> getMemberIds() { return memberIds; }
    public void setMemberIds(List<Long> memberIds) { this.memberIds = memberIds != null ? memberIds : new ArrayList<>(); }

    public List<String> getRoles() { return roles; }
    public void setRoles(List<String> roles) { this.roles = roles != null ? roles : new ArrayList<>(); }

    public List<String> getIssueTypes() { return issueTypes; }
    public void setIssueTypes(List<String> issueTypes) { this.issueTypes = issueTypes != null ? issueTypes : new ArrayList<>(); }

    public List<String> getPriorities() { return priorities; }
    public void setPriorities(List<String> priorities) { this.priorities = priorities != null ? priorities : new ArrayList<>(); }

    public List<String> getStatuses() { return statuses; }
    public void setStatuses(List<String> statuses) { this.statuses = statuses != null ? statuses : new ArrayList<>(); }

    public Long getSprintId() { return sprintId; }
    public void setSprintId(Long sprintId) { this.sprintId = sprintId; }

    public Boolean getOverdueOnly() { return overdueOnly; }
    public void setOverdueOnly(Boolean overdueOnly) { this.overdueOnly = overdueOnly; }

    public String getSort() { return sort; }
    public void setSort(String sort) { this.sort = sort; }

    public Integer getPage() { return page; }
    public void setPage(Integer page) { this.page = page; }

    public Integer getSize() { return size; }
    public void setSize(Integer size) { this.size = size; }
}
