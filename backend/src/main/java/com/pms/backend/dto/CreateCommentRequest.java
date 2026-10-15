package com.pms.backend.dto;

import jakarta.validation.constraints.NotBlank;
import java.util.List;

public class CreateCommentRequest {
    @NotBlank(message = "Comment content cannot be empty")
    private String content;

    private List<Long> mentionedUserIds;

    public CreateCommentRequest() {}

    public String getContent() { return content; }
    public void setContent(String content) { this.content = content; }

    public List<Long> getMentionedUserIds() { return mentionedUserIds; }
    public void setMentionedUserIds(List<Long> mentionedUserIds) { this.mentionedUserIds = mentionedUserIds; }
}
