package com.pms.backend.dto;

import com.pms.backend.model.IssueStatusHistory;
import java.time.LocalDateTime;

public class IssueStatusHistoryResponse {
    private Long id;
    private String fromStatus;
    private String toStatus;
    private UserResponse changedBy;
    private String comment;
    private LocalDateTime changedAt;

    public static IssueStatusHistoryResponse from(IssueStatusHistory history) {
        if (history == null) return null;
        IssueStatusHistoryResponse res = new IssueStatusHistoryResponse();
        res.setId(history.getId());
        res.setFromStatus(history.getFromStatus() != null ? history.getFromStatus().getName() : null);
        res.setToStatus(history.getToStatus() != null ? history.getToStatus().getName() : null);
        res.setChangedBy(UserResponse.from(history.getChangedBy()));
        res.setComment(history.getComment());
        res.setChangedAt(history.getChangedAt());
        return res;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getFromStatus() { return fromStatus; }
    public void setFromStatus(String fromStatus) { this.fromStatus = fromStatus; }

    public String getToStatus() { return toStatus; }
    public void setToStatus(String toStatus) { this.toStatus = toStatus; }

    public UserResponse getChangedBy() { return changedBy; }
    public void setChangedBy(UserResponse changedBy) { this.changedBy = changedBy; }

    public String getComment() { return comment; }
    public void setComment(String comment) { this.comment = comment; }

    public LocalDateTime getChangedAt() { return changedAt; }
    public void setChangedAt(LocalDateTime changedAt) { this.changedAt = changedAt; }
}
