package com.pms.backend.model;

import com.pms.backend.common.BaseEntity;

import jakarta.persistence.*;

@Entity
@Table(name = "saved_filters")
public class SavedFilter extends BaseEntity {
@Column(nullable = false)
    private String name;

    @Column(columnDefinition = "TEXT", nullable = false)
    private String filterConfigJson;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    // Getters and Setters
public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getFilterConfigJson() { return filterConfigJson; }
    public void setFilterConfigJson(String filterConfigJson) { this.filterConfigJson = filterConfigJson; }
    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }
}
