package com.pms.backend.dto;

import com.pms.backend.model.IssueAttachment;
import java.time.LocalDateTime;

public class AttachmentResponse {
    private Long id;
    private String fileName;
    private String fileUrl;
    private Long fileSize;
    private String contentType;
    private UserResponse uploadedBy;
    private LocalDateTime createdAt;

    public static AttachmentResponse from(IssueAttachment attachment) {
        if (attachment == null) return null;
        AttachmentResponse res = new AttachmentResponse();
        res.setId(attachment.getId());
        res.setFileName(attachment.getFileName());
        res.setFileUrl(attachment.getFileUrl());
        res.setFileSize(attachment.getFileSize());
        res.setContentType(attachment.getContentType());
        res.setUploadedBy(UserResponse.from(attachment.getUploadedBy()));
        res.setCreatedAt(attachment.getCreatedAt());
        return res;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getFileName() { return fileName; }
    public void setFileName(String fileName) { this.fileName = fileName; }

    public String getFileUrl() { return fileUrl; }
    public void setFileUrl(String fileUrl) { this.fileUrl = fileUrl; }

    public Long getFileSize() { return fileSize; }
    public void setFileSize(Long fileSize) { this.fileSize = fileSize; }

    public String getContentType() { return contentType; }
    public void setContentType(String contentType) { this.contentType = contentType; }

    public UserResponse getUploadedBy() { return uploadedBy; }
    public void setUploadedBy(UserResponse uploadedBy) { this.uploadedBy = uploadedBy; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
