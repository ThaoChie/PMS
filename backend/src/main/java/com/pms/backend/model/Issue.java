package com.pms.backend.model;

import com.pms.backend.common.BaseEntity;

import com.pms.backend.enu.IssueType;
import com.pms.backend.enu.Priority;
import jakarta.persistence.*;
import java.util.List;

@Entity
@Table(name = "issues")
public class Issue extends BaseEntity {
    @Column(nullable = false, unique = true)
    private String issueKey;

    @Column(nullable = false)
    private String summary;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Enumerated(EnumType.STRING)
    private IssueType type;

    @Enumerated(EnumType.STRING)
    private Priority priority;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "status_id")
    private WorkflowStatus status;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "reporter_id", updatable = false)
    private User reporter;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assignee_id")
    private User assignee;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "project_id")
    private Project project;

    @ManyToOne
    @JoinColumn(name = "epic_link_id")
    private Issue epicLink;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "parent_issue_id")
    private Issue parentIssue;

    @OneToMany(mappedBy = "parentIssue", cascade = CascadeType.ALL)
    private List<Issue> subtasks;

    private Integer originalEstimate;
    private Integer remainingEstimate;

    // Getters and Setters
    public String getIssueKey() { return issueKey; }
    public void setIssueKey(String issueKey) { this.issueKey = issueKey; }
    public String getSummary() { return summary; }
    public void setSummary(String summary) { this.summary = summary; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public IssueType getType() { return type; }
    public void setType(IssueType type) { this.type = type; }
    public Priority getPriority() { return priority; }
    public void setPriority(Priority priority) { this.priority = priority; }
    public WorkflowStatus getStatus() { return status; }
    public void setStatus(WorkflowStatus status) { this.status = status; }
    public User getReporter() { return reporter; }
    public void setReporter(User reporter) { this.reporter = reporter; }
    public User getAssignee() { return assignee; }
    public void setAssignee(User assignee) { this.assignee = assignee; }
    public Issue getEpicLink() { return epicLink; }
    public void setEpicLink(Issue epicLink) { this.epicLink = epicLink; }
    public Project getProject() { return project; }
    public void setProject(Project project) { this.project = project; }
    public Issue getParentIssue() { return parentIssue; }
    public void setParentIssue(Issue parentIssue) { this.parentIssue = parentIssue; }
    public List<Issue> getSubtasks() { return subtasks; }
    public void setSubtasks(List<Issue> subtasks) { this.subtasks = subtasks; }
    public Integer getOriginalEstimate() { return originalEstimate; }
    public void setOriginalEstimate(Integer originalEstimate) { this.originalEstimate = originalEstimate; }
    public Integer getRemainingEstimate() { return remainingEstimate; }
    public void setRemainingEstimate(Integer remainingEstimate) { this.remainingEstimate = remainingEstimate; }
}
