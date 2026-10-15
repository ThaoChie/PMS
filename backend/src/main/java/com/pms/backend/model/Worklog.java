package com.pms.backend.model;

import com.pms.backend.common.BaseEntity;
import jakarta.persistence.*;

import java.time.LocalDate;

@Entity
@Table(name = "worklogs")
public class Worklog extends BaseEntity {

    @Column(name = "time_spent_min", nullable = false)
    private Integer timeSpentMin;

    @Column(name = "work_date", nullable = false)
    private LocalDate workDate;

    @Column(columnDefinition = "TEXT")
    private String comment;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "issue_id", nullable = false)
    private Issue issue;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    public Worklog() {}

    public Worklog(Issue issue, User user, Integer timeSpentMin, LocalDate workDate, String comment) {
        this.issue = issue;
        this.user = user;
        this.timeSpentMin = timeSpentMin;
        this.workDate = workDate;
        this.comment = comment;
    }

    public Integer getTimeSpentMin() { return timeSpentMin; }
    public void setTimeSpentMin(Integer timeSpentMin) { this.timeSpentMin = timeSpentMin; }

    public LocalDate getWorkDate() { return workDate; }
    public void setWorkDate(LocalDate workDate) { this.workDate = workDate; }

    public String getComment() { return comment; }
    public void setComment(String comment) { this.comment = comment; }

    public Issue getIssue() { return issue; }
    public void setIssue(Issue issue) { this.issue = issue; }

    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }

    // Backward compatibility helper methods
    public Integer getTimeSpent() { return timeSpentMin; }
    public void setTimeSpent(Integer timeSpent) { this.timeSpentMin = timeSpent; }

    public LocalDate getDate() { return workDate; }
    public void setDate(LocalDate date) { this.workDate = date; }

    public String getNote() { return comment; }
    public void setNote(String note) { this.comment = note; }
}
