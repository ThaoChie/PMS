package com.pms.backend.model;

import com.pms.backend.common.BaseEntity;
import com.pms.backend.enu.StatusCategory;
import jakarta.persistence.*;

@Entity
@Table(name = "workflow_statuses")
public class WorkflowStatus extends BaseEntity {

    @Column(nullable = false, length = 100)
    private String name;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "project_id", nullable = false)
    private Project project;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private StatusCategory category = StatusCategory.TODO;

    @Column(nullable = false)
    private int position = 0;

    @Column(name = "is_initial", nullable = false)
    private boolean isInitial = false;

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public Project getProject() { return project; }
    public void setProject(Project project) { this.project = project; }
    public StatusCategory getCategory() { return category; }
    public void setCategory(StatusCategory category) { this.category = category; }
    public int getPosition() { return position; }
    public void setPosition(int position) { this.position = position; }
    public boolean isInitial() { return isInitial; }
    public void setInitial(boolean initial) { isInitial = initial; }
}
