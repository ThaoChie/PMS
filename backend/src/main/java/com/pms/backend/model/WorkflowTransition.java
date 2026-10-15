package com.pms.backend.model;

import com.pms.backend.common.BaseEntity;
import com.pms.backend.enu.TransitionType;
import jakarta.persistence.*;

@Entity
@Table(name = "workflow_transitions")
public class WorkflowTransition extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "project_id", nullable = false)
    private Project project;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "from_status_id", nullable = false)
    private WorkflowStatus fromStatus;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "to_status_id", nullable = false)
    private WorkflowStatus toStatus;

    @Column(nullable = false, length = 100)
    private String name;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private TransitionType type = TransitionType.NORMAL;

    @Column(name = "required_fields", columnDefinition = "TEXT")
    private String requiredFields;

    public Project getProject() { return project; }
    public void setProject(Project project) { this.project = project; }
    public WorkflowStatus getFromStatus() { return fromStatus; }
    public void setFromStatus(WorkflowStatus fromStatus) { this.fromStatus = fromStatus; }
    public WorkflowStatus getToStatus() { return toStatus; }
    public void setToStatus(WorkflowStatus toStatus) { this.toStatus = toStatus; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public TransitionType getType() { return type; }
    public void setType(TransitionType type) { this.type = type; }
    public String getRequiredFields() { return requiredFields; }
    public void setRequiredFields(String requiredFields) { this.requiredFields = requiredFields; }
}
