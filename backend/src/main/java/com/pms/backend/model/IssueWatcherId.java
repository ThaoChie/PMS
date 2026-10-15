package com.pms.backend.model;

import java.io.Serializable;
import java.util.Objects;

public class IssueWatcherId implements Serializable {
    private Long issue;
    private Long user;

    public IssueWatcherId() {}

    public IssueWatcherId(Long issue, Long user) {
        this.issue = issue;
        this.user = user;
    }

    public Long getIssue() { return issue; }
    public void setIssue(Long issue) { this.issue = issue; }

    public Long getUser() { return user; }
    public void setUser(Long user) { this.user = user; }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        IssueWatcherId that = (IssueWatcherId) o;
        return Objects.equals(issue, that.issue) && Objects.equals(user, that.user);
    }

    @Override
    public int hashCode() {
        return Objects.hash(issue, user);
    }
}
