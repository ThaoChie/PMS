package com.pms.backend.dto;

import jakarta.validation.constraints.NotBlank;

public class UpdateCommentRequest {
    @NotBlank(message = "Comment content cannot be empty")
    private String content;

    public UpdateCommentRequest() {}

    public String getContent() { return content; }
    public void setContent(String content) { this.content = content; }
}
