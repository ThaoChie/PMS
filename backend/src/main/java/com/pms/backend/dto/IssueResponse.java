package com.pms.backend.dto;

import com.pms.backend.enu.IssueType;
import com.pms.backend.enu.Priority;
import com.pms.backend.model.Issue;
import com.pms.backend.model.Label;
import com.pms.backend.util.DurationParser;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

public class IssueResponse {
    private Long id;
    private String key;
    private String issueKey;
    private String summary;
    private String description;
    private IssueType type;
    private Priority priority;
    private String status;
    private Long statusId;
    private String statusCategory;
    private UserResponse assignee;
    private UserResponse reporter;
    private Long projectId;
    private String projectKey;
    private List<String> labels = new ArrayList<>();
    private String estimates;
    private Integer originalEstimateMin;
    private Integer remainingEstimateMin;
    private Integer timeSpentMin;
    private LocalDate dueDate;
    private String environment;
    private String resolution;
    private Integer version;
    private String epicLink;
    private Long epicId;
    private String parentKey;
    private Long parentId;
    private List<SubtaskResponse> subtasks = new ArrayList<>();
    private List<LinkedIssueResponse> linkedIssues = new ArrayList<>();
    private List<AttachmentResponse> attachments = new ArrayList<>();
    private List<TransitionOptionResponse> availableTransitions = new ArrayList<>();
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public static IssueResponse from(Issue issue) {
        if (issue == null) return null;
        IssueResponse res = new IssueResponse();
        res.setId(issue.getId());
        res.setKey(issue.getIssueKey());
        res.setIssueKey(issue.getIssueKey());
        res.setSummary(issue.getSummary());
        res.setDescription(issue.getDescription());
        res.setType(issue.getType());
        res.setPriority(issue.getPriority());

        if (issue.getStatus() != null) {
            res.setStatus(issue.getStatus().getName());
            res.setStatusId(issue.getStatus().getId());
            res.setStatusCategory(issue.getStatus().getCategory() != null ? issue.getStatus().getCategory().name() : "TODO");
        }

        res.setAssignee(UserResponse.from(issue.getAssignee()));
        res.setReporter(UserResponse.from(issue.getReporter()));

        if (issue.getProject() != null) {
            res.setProjectId(issue.getProject().getId());
            res.setProjectKey(issue.getProject().getProjectKey());
        }

        if (issue.getLabels() != null) {
            res.setLabels(issue.getLabels().stream().map(Label::getName).collect(Collectors.toList()));
        }

        res.setOriginalEstimateMin(issue.getOriginalEstimateMin());
        res.setRemainingEstimateMin(issue.getRemainingEstimateMin());
        res.setTimeSpentMin(issue.getTimeSpentMin());
        res.setEstimates(DurationParser.formatMinutes(issue.getRemainingEstimateMin() != null && issue.getRemainingEstimateMin() > 0 ? issue.getRemainingEstimateMin() : issue.getOriginalEstimateMin()));

        res.setDueDate(issue.getDueDate());
        res.setEnvironment(issue.getEnvironment());
        res.setResolution(issue.getResolution());
        res.setVersion(issue.getVersion());

        if (issue.getEpic() != null) {
            res.setEpicLink(issue.getEpic().getIssueKey());
            res.setEpicId(issue.getEpic().getId());
        }

        if (issue.getParent() != null) {
            res.setParentKey(issue.getParent().getIssueKey());
            res.setParentId(issue.getParent().getId());
        }

        if (issue.getSubtasks() != null) {
            res.setSubtasks(issue.getSubtasks().stream()
                    .filter(st -> st.getDeletedAt() == null)
                    .map(SubtaskResponse::from)
                    .collect(Collectors.toList()));
        }

        if (issue.getAttachments() != null) {
            res.setAttachments(issue.getAttachments().stream()
                    .map(AttachmentResponse::from)
                    .collect(Collectors.toList()));
        }

        res.setCreatedAt(issue.getCreatedAt());
        res.setUpdatedAt(issue.getUpdatedAt());

        return res;
    }

    // Getters and Setters

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getKey() { return key; }
    public void setKey(String key) { this.key = key; }

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

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public Long getStatusId() { return statusId; }
    public void setStatusId(Long statusId) { this.statusId = statusId; }

    public String getStatusCategory() { return statusCategory; }
    public void setStatusCategory(String statusCategory) { this.statusCategory = statusCategory; }

    public UserResponse getAssignee() { return assignee; }
    public void setAssignee(UserResponse assignee) { this.assignee = assignee; }

    public UserResponse getReporter() { return reporter; }
    public void setReporter(UserResponse reporter) { this.reporter = reporter; }

    public Long getProjectId() { return projectId; }
    public void setProjectId(Long projectId) { this.projectId = projectId; }

    public String getProjectKey() { return projectKey; }
    public void setProjectKey(String projectKey) { this.projectKey = projectKey; }

    public List<String> getLabels() { return labels; }
    public void setLabels(List<String> labels) { this.labels = labels; }

    public String getEstimates() { return estimates; }
    public void setEstimates(String estimates) { this.estimates = estimates; }

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

    public String getResolution() { return resolution; }
    public void setResolution(String resolution) { this.resolution = resolution; }

    public Integer getVersion() { return version; }
    public void setVersion(Integer version) { this.version = version; }

    public String getEpicLink() { return epicLink; }
    public void setEpicLink(String epicLink) { this.epicLink = epicLink; }

    public Long getEpicId() { return epicId; }
    public void setEpicId(Long epicId) { this.epicId = epicId; }

    public String getParentKey() { return parentKey; }
    public void setParentKey(String parentKey) { this.parentKey = parentKey; }

    public Long getParentId() { return parentId; }
    public void setParentId(Long parentId) { this.parentId = parentId; }

    public List<SubtaskResponse> getSubtasks() { return subtasks; }
    public void setSubtasks(List<SubtaskResponse> subtasks) { this.subtasks = subtasks; }

    public List<LinkedIssueResponse> getLinkedIssues() { return linkedIssues; }
    public void setLinkedIssues(List<LinkedIssueResponse> linkedIssues) { this.linkedIssues = linkedIssues; }

    public List<AttachmentResponse> getAttachments() { return attachments; }
    public void setAttachments(List<AttachmentResponse> attachments) { this.attachments = attachments; }

    public List<TransitionOptionResponse> getAvailableTransitions() { return availableTransitions; }
    public void setAvailableTransitions(List<TransitionOptionResponse> availableTransitions) { this.availableTransitions = availableTransitions; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
