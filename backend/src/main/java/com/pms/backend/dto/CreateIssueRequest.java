package com.pms.backend.dto;

import com.pms.backend.enu.IssueType;
import com.pms.backend.enu.Priority;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

public class CreateIssueRequest {

    @NotBlank(message = "Summary is required")
    @Size(max = 255, message = "Summary cannot exceed 255 characters")
    private String summary;

    private String description;

    @NotNull(message = "Issue type is required")
    private IssueType type;

    private Priority priority = Priority.MEDIUM;

    private Long assigneeId;

    private List<String> labels;

    private String estimates;

    private Integer originalEstimateMin;

    private Integer remainingEstimateMin;

    private LocalDate dueDate;

    private String environment;

    private Long parentId;

    private Long epicId;

    private Map<String, String> customFields;

    public String getSummary() { return summary; }
    public void setSummary(String summary) { this.summary = summary; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public IssueType getType() { return type; }
    public void setType(IssueType type) { this.type = type; }

    public Priority getPriority() { return priority; }
    public void setPriority(Priority priority) { this.priority = priority; }

    public Long getAssigneeId() { return assigneeId; }
    public void setAssigneeId(Long assigneeId) { this.assigneeId = assigneeId; }

    public List<String> getLabels() { return labels; }
    public void setLabels(List<String> labels) { this.labels = labels; }

    public String getEstimates() { return estimates; }
    public void setEstimates(String estimates) { this.estimates = estimates; }

    public Integer getOriginalEstimateMin() { return originalEstimateMin; }
    public void setOriginalEstimateMin(Integer originalEstimateMin) { this.originalEstimateMin = originalEstimateMin; }

    public Integer getRemainingEstimateMin() { return remainingEstimateMin; }
    public void setRemainingEstimateMin(Integer remainingEstimateMin) { this.remainingEstimateMin = remainingEstimateMin; }

    public LocalDate getDueDate() { return dueDate; }
    public void setDueDate(LocalDate dueDate) { this.dueDate = dueDate; }

    public String getEnvironment() { return environment; }
    public void setEnvironment(String environment) { this.environment = environment; }

    public Long getParentId() { return parentId; }
    public void setParentId(Long parentId) { this.parentId = parentId; }

    public Long getEpicId() { return epicId; }
    public void setEpicId(Long epicId) { this.epicId = epicId; }

    public Map<String, String> getCustomFields() { return customFields; }
    public void setCustomFields(Map<String, String> customFields) { this.customFields = customFields; }
}
