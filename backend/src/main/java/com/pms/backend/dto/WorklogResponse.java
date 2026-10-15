package com.pms.backend.dto;

import com.pms.backend.model.Worklog;
import com.pms.backend.util.DurationParser;

import java.time.format.DateTimeFormatter;

public class WorklogResponse {
    private String id;
    private UserResponse author;
    private String timeSpent;
    private Integer timeSpentMinutes;
    private String date;
    private String comment;
    private String createdAt;

    public WorklogResponse() {}

    public static WorklogResponse from(Worklog w) {
        if (w == null) return null;
        WorklogResponse res = new WorklogResponse();
        res.setId(String.valueOf(w.getId()));
        res.setAuthor(UserResponse.from(w.getUser()));
        res.setTimeSpentMinutes(w.getTimeSpentMin());
        res.setTimeSpent(DurationParser.formatMinutes(w.getTimeSpentMin()));
        if (w.getWorkDate() != null) {
            res.setDate(w.getWorkDate().toString());
        }
        res.setComment(w.getComment());
        if (w.getCreatedAt() != null) {
            res.setCreatedAt(w.getCreatedAt().format(DateTimeFormatter.ISO_DATE_TIME));
        }
        return res;
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public UserResponse getAuthor() { return author; }
    public void setAuthor(UserResponse author) { this.author = author; }

    public String getTimeSpent() { return timeSpent; }
    public void setTimeSpent(String timeSpent) { this.timeSpent = timeSpent; }

    public Integer getTimeSpentMinutes() { return timeSpentMinutes; }
    public void setTimeSpentMinutes(Integer timeSpentMinutes) { this.timeSpentMinutes = timeSpentMinutes; }

    public String getDate() { return date; }
    public void setDate(String date) { this.date = date; }

    public String getComment() { return comment; }
    public void setComment(String comment) { this.comment = comment; }

    public String getCreatedAt() { return createdAt; }
    public void setCreatedAt(String createdAt) { this.createdAt = createdAt; }
}
