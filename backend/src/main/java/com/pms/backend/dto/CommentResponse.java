package com.pms.backend.dto;

import com.pms.backend.model.Comment;
import com.pms.backend.model.User;

import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

public class CommentResponse {
    private String id;
    private UserResponse author;
    private String content;
    private String createdAt;
    private String updatedAt;
    private String type = "comment";
    private List<Long> mentionedUserIds = new ArrayList<>();

    public CommentResponse() {}

    public static CommentResponse from(Comment comment) {
        if (comment == null) return null;
        CommentResponse res = new CommentResponse();
        res.setId(String.valueOf(comment.getId()));
        res.setAuthor(UserResponse.from(comment.getUser()));
        res.setContent(comment.getContent());
        if (comment.getCreatedAt() != null) {
            res.setCreatedAt(comment.getCreatedAt().format(DateTimeFormatter.ISO_DATE_TIME));
        }
        if (comment.getUpdatedAt() != null) {
            res.setUpdatedAt(comment.getUpdatedAt().format(DateTimeFormatter.ISO_DATE_TIME));
        }
        if (comment.getMentions() != null) {
            res.setMentionedUserIds(comment.getMentions().stream().map(User::getId).collect(Collectors.toList()));
        }
        return res;
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public UserResponse getAuthor() { return author; }
    public void setAuthor(UserResponse author) { this.author = author; }

    public String getContent() { return content; }
    public void setContent(String content) { this.content = content; }

    public String getCreatedAt() { return createdAt; }
    public void setCreatedAt(String createdAt) { this.createdAt = createdAt; }

    public String getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(String updatedAt) { this.updatedAt = updatedAt; }

    public String getType() { return type; }
    public void setType(String type) { this.type = type; }

    public List<Long> getMentionedUserIds() { return mentionedUserIds; }
    public void setMentionedUserIds(List<Long> mentionedUserIds) { this.mentionedUserIds = mentionedUserIds; }
}
