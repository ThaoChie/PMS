package com.pms.backend.model;

import com.pms.backend.common.BaseEntity;
import com.pms.backend.enu.IssueType;
import com.pms.backend.enu.Priority;
import jakarta.persistence.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Entity
@Table(name = "issues")
public class Issue extends BaseEntity {

    @Column(name = "issue_key", nullable = false, unique = true, length = 50)
    private String issueKey;

    @Column(nullable = false, length = 255)
    private String summary;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 50)
    private IssueType type;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 50)
    private Priority priority = Priority.MEDIUM;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "status_id")
    private WorkflowStatus status;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "reporter_id", nullable = false, updatable = false)
    private User reporter;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assignee_id")
    private User assignee;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "project_id", nullable = false)
    private Project project;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "parent_id")
    private Issue parent;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "epic_id")
    private Issue epic;

    @OneToMany(mappedBy = "parent", cascade = CascadeType.ALL)
    private List<Issue> subtasks = new ArrayList<>();

    @Column(length = 255)
    private String resolution;

    @Column(name = "original_estimate_min")
    private Integer originalEstimateMin = 0;

    @Column(name = "remaining_estimate_min")
    private Integer remainingEstimateMin = 0;

    @Column(name = "time_spent_min")
    private Integer timeSpentMin = 0;

    @Column(name = "due_date")
    private LocalDate dueDate;

    @Column(length = 255)
    private String environment;

    @Version
    @Column(nullable = false)
    private Integer version = 0;

    @Column(name = "deleted_at")
    private LocalDateTime deletedAt;

    @ManyToMany
    @JoinTable(
            name = "issue_labels",
            joinColumns = @JoinColumn(name = "issue_id"),
            inverseJoinColumns = @JoinColumn(name = "label_id")
    )
    private Set<Label> labels = new HashSet<>();

    @OneToMany(mappedBy = "issue", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<IssueAttachment> attachments = new ArrayList<>();

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

    public Project getProject() { return project; }
    public void setProject(Project project) { this.project = project; }

    public Issue getParent() { return parent; }
    public void setParent(Issue parent) { this.parent = parent; }

    public Issue getEpic() { return epic; }
    public void setEpic(Issue epic) { this.epic = epic; }

    public List<Issue> getSubtasks() { return subtasks; }
    public void setSubtasks(List<Issue> subtasks) { this.subtasks = subtasks; }

    public String getResolution() { return resolution; }
    public void setResolution(String resolution) { this.resolution = resolution; }

    public Integer getOriginalEstimateMin() { return originalEstimateMin; }
    public void setOriginalEstimateMin(Integer originalEstimateMin) { this.originalEstimateMin = originalEstimateMin; }

    public Integer getRemainingEstimateMin() { return remainingEstimateMin; }
    public void setRemainingEstimateMin(Integer remainingEstimateMin) { this.remainingEstimateMin = remainingEstimateMin; }

    public Integer getTimeSpentMin() { return timeSpentMin; }
    public void setTimeSpentMin(Integer timeSpentMin) { this.timeSpentMin = timeSpentMin; }

    public LocalDate getDueDate() { return dueDate; }
    public void setDueDate(LocalDate dueDate) { this.dueDate = dueDate; }

    public String getEnvironment() { return environment; }
    public void setEnvironment(String environment) { this.environment = environment; }

    public Integer getVersion() { return version; }
    public void setVersion(Integer version) { this.version = version; }

    public LocalDateTime getDeletedAt() { return deletedAt; }
    public void setDeletedAt(LocalDateTime deletedAt) { this.deletedAt = deletedAt; }

    public Set<Label> getLabels() { return labels; }
    public void setLabels(Set<Label> labels) { this.labels = labels; }

    public List<IssueAttachment> getAttachments() { return attachments; }
    public void setAttachments(List<IssueAttachment> attachments) { this.attachments = attachments; }

    public Integer getRemainingEstimate() { return remainingEstimateMin; }
    public void setRemainingEstimate(Integer remainingEstimate) { this.remainingEstimateMin = remainingEstimate; }

    public Integer getOriginalEstimate() { return originalEstimateMin; }
    public void setOriginalEstimate(Integer originalEstimate) { this.originalEstimateMin = originalEstimate; }
}
