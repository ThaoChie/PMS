package com.pms.backend.dto;

import com.fasterxml.jackson.annotation.JsonAlias;
import jakarta.validation.constraints.NotBlank;
import java.time.LocalDate;

public class CreateWorklogRequest {
    @NotBlank(message = "Time spent is required")
    private String timeSpent;

    private LocalDate date;

    private String comment;

    public CreateWorklogRequest() {}

    public String getTimeSpent() { return timeSpent; }
    public void setTimeSpent(String timeSpent) { this.timeSpent = timeSpent; }

    public LocalDate getDate() { return date; }
    public void setDate(LocalDate date) { this.date = date; }

    public String getComment() { return comment; }
    public void setComment(String comment) { this.comment = comment; }
}
