package com.pms.backend.model;

import com.pms.backend.common.BaseEntity;
import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "recent_views", uniqueConstraints = {
        @UniqueConstraint(name = "uk_recent_views", columnNames = {"user_id", "issue_id"})
})
public class RecentView extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "issue_id", nullable = false)
    private Issue issue;

    @Column(name = "viewed_at", nullable = false)
    private LocalDateTime viewedAt = LocalDateTime.now();

    public RecentView() {}

    public RecentView(User user, Issue issue) {
        this.user = user;
        this.issue = issue;
        this.viewedAt = LocalDateTime.now();
    }

    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }

    public Issue getIssue() { return issue; }
    public void setIssue(Issue issue) { this.issue = issue; }

    public LocalDateTime getViewedAt() { return viewedAt; }
    public void setViewedAt(LocalDateTime viewedAt) { this.viewedAt = viewedAt; }
}
