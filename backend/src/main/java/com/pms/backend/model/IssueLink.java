package com.pms.backend.model;

import com.pms.backend.enu.LinkType;
import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "issue_links", uniqueConstraints = {
        @UniqueConstraint(name = "uk_issue_link", columnNames = {"source_issue_id", "target_issue_id", "link_type"})
})
public class IssueLink {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "source_issue_id", nullable = false)
    private Issue sourceIssue;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "target_issue_id", nullable = false)
    private Issue targetIssue;

    @Enumerated(EnumType.STRING)
    @Column(name = "link_type", nullable = false, length = 50)
    private LinkType linkType;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    public IssueLink() {}

    public IssueLink(Issue sourceIssue, Issue targetIssue, LinkType linkType) {
        this.sourceIssue = sourceIssue;
        this.targetIssue = targetIssue;
        this.linkType = linkType;
        this.createdAt = LocalDateTime.now();
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Issue getSourceIssue() { return sourceIssue; }
    public void setSourceIssue(Issue sourceIssue) { this.sourceIssue = sourceIssue; }

    public Issue getTargetIssue() { return targetIssue; }
    public void setTargetIssue(Issue targetIssue) { this.targetIssue = targetIssue; }

    public LinkType getLinkType() { return linkType; }
    public void setLinkType(LinkType linkType) { this.linkType = linkType; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
