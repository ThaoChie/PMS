package com.pms.backend.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "issue_status_history")
public class IssueStatusHistory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "issue_id", nullable = false)
    private Issue issue;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "project_id")
    private Project project;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "from_status_id")
    private WorkflowStatus fromStatus;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "to_status_id", nullable = false)
    private WorkflowStatus toStatus;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "changed_by_id")
    private User changedBy;

    @Column(columnDefinition = "TEXT")
    private String comment;

    @Column(name = "changed_at", nullable = false, updatable = false)
    private LocalDateTime changedAt = LocalDateTime.now();

    public IssueStatusHistory() {}

    public IssueStatusHistory(Issue issue, WorkflowStatus fromStatus, WorkflowStatus toStatus, User changedBy, String comment) {
        this.issue = issue;
        this.project = (issue != null) ? issue.getProject() : null;
        this.fromStatus = fromStatus;
        this.toStatus = toStatus;
        this.changedBy = changedBy;
        this.comment = comment;
        this.changedAt = LocalDateTime.now();
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Issue getIssue() { return issue; }
    public void setIssue(Issue issue) { this.issue = issue; }

    public Project getProject() { return project; }
    public void setProject(Project project) { this.project = project; }

    public WorkflowStatus getFromStatus() { return fromStatus; }
    public void setFromStatus(WorkflowStatus fromStatus) { this.fromStatus = fromStatus; }

    public WorkflowStatus getToStatus() { return toStatus; }
    public void setToStatus(WorkflowStatus toStatus) { this.toStatus = toStatus; }

    public User getChangedBy() { return changedBy; }
    public void setChangedBy(User changedBy) { this.changedBy = changedBy; }

    public String getComment() { return comment; }
    public void setComment(String comment) { this.comment = comment; }

    public LocalDateTime getChangedAt() { return changedAt; }
    public void setChangedAt(LocalDateTime changedAt) { this.changedAt = changedAt; }
}
