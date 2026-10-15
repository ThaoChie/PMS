package com.pms.backend.model;

import com.pms.backend.common.BaseEntity;
import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "filter_subscriptions", uniqueConstraints = {
        @UniqueConstraint(name = "uk_filter_user_subscription", columnNames = {"filter_id", "user_id"})
})
public class FilterSubscription extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "filter_id", nullable = false)
    private SavedFilter filter;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false, length = 20)
    private String frequency; // DAILY or WEEKLY

    @Column(name = "next_run_at", nullable = false)
    private LocalDateTime nextRunAt;

    public FilterSubscription() {}

    public FilterSubscription(SavedFilter filter, User user, String frequency, LocalDateTime nextRunAt) {
        this.filter = filter;
        this.user = user;
        this.frequency = frequency;
        this.nextRunAt = nextRunAt;
    }

    public SavedFilter getFilter() { return filter; }
    public void setFilter(SavedFilter filter) { this.filter = filter; }

    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }

    public String getFrequency() { return frequency; }
    public void setFrequency(String frequency) { this.frequency = frequency; }

    public LocalDateTime getNextRunAt() { return nextRunAt; }
    public void setNextRunAt(LocalDateTime nextRunAt) { this.nextRunAt = nextRunAt; }
}
