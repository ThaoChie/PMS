package com.pms.backend.model;

import com.pms.backend.common.BaseEntity;

import com.pms.backend.enu.ProjectRole;
import jakarta.persistence.*;

@Entity
@Table(name = "project_members")
public class ProjectMember extends BaseEntity {
@ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "project_id")
    private Project project;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user;

    @Enumerated(EnumType.STRING)
    private ProjectRole role;

    // Getters and Setters
public Project getProject() { return project; }
    public void setProject(Project project) { this.project = project; }
    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }
    public ProjectRole getRole() { return role; }
    public void setRole(ProjectRole role) { this.role = role; }
}
