package com.pms.backend.model;

import com.pms.backend.common.BaseEntity;
import jakarta.persistence.*;

import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name = "comments")
public class Comment extends BaseEntity {

    @Column(columnDefinition = "TEXT", nullable = false)
    private String content;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "issue_id", nullable = false)
    private Issue issue;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToMany
    @JoinTable(
            name = "comment_mentions",
            joinColumns = @JoinColumn(name = "comment_id"),
            inverseJoinColumns = @JoinColumn(name = "user_id")
    )
    private Set<User> mentions = new HashSet<>();

    public Comment() {}

    public Comment(Issue issue, User user, String content) {
        this.issue = issue;
        this.user = user;
        this.content = content;
    }

    public String getContent() { return content; }
    public void setContent(String content) { this.content = content; }

    public Issue getIssue() { return issue; }
    public void setIssue(Issue issue) { this.issue = issue; }

    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }

    public Set<User> getMentions() { return mentions; }
    public void setMentions(Set<User> mentions) { this.mentions = mentions; }
}
