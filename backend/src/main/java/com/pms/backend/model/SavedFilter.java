package com.pms.backend.model;

import com.pms.backend.common.BaseEntity;
import jakarta.persistence.*;

import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name = "saved_filters")
public class SavedFilter extends BaseEntity {

    @Column(nullable = false, length = 100)
    private String name;

    @Column(columnDefinition = "TEXT", nullable = false)
    private String criteria;

    @Column(name = "is_shared", nullable = false)
    private Boolean isShared = false;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToMany
    @JoinTable(
            name = "saved_filter_shares",
            joinColumns = @JoinColumn(name = "filter_id"),
            inverseJoinColumns = @JoinColumn(name = "user_id")
    )
    private Set<User> sharedUsers = new HashSet<>();

    public SavedFilter() {}

    public SavedFilter(String name, String criteria, User user) {
        this.name = name;
        this.criteria = criteria;
        this.user = user;
        this.isShared = false;
    }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getCriteria() { return criteria; }
    public void setCriteria(String criteria) { this.criteria = criteria; }

    public Boolean getIsShared() { return isShared; }
    public void setIsShared(Boolean shared) { isShared = shared; }

    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }

    public Set<User> getSharedUsers() { return sharedUsers; }
    public void setSharedUsers(Set<User> sharedUsers) { this.sharedUsers = sharedUsers; }

    // Backward compatibility helper methods
    public String getFilterConfigJson() { return criteria; }
    public void setFilterConfigJson(String filterConfigJson) { this.criteria = filterConfigJson; }
}
