package com.pms.backend.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.pms.backend.enu.NotificationType;
import com.pms.backend.model.Notification;
import java.time.OffsetDateTime;
import java.time.ZoneId;

public class NotificationResponse {
    private Long id;
    private String type;
    private String title;
    private String description;
    private String message;
    private String link;
    private boolean isRead;
    private String data;
    private String sourceId;
    private UserResponse sender;
    /**
     * Thời điểm tạo, KÈM MÚI GIỜ (vd "2026-11-14T10:55:00+07:00").
     * Entity lưu LocalDateTime theo giờ máy chủ (Render chạy UTC). Gửi chuỗi không múi giờ
     * khiến trình duyệt hiểu nhầm là giờ Việt Nam -> thông báo mới hiện "7 giờ trước".
     */
    private OffsetDateTime createdAt;

    public static NotificationResponse from(Notification n) {
        if (n == null) return null;
        NotificationResponse res = new NotificationResponse();
        res.setId(n.getId());
        res.setType(mapTypeToFrontend(n.getType()));
        res.setTitle(n.getTitle());
        res.setDescription(n.getMessage());
        res.setMessage(n.getMessage());
        res.setLink(n.getLink());
        res.setRead(n.isRead());
        res.setData(n.getData());
        res.setSourceId(n.getData());
        res.setSender(UserResponse.from(n.getSender()));
        res.setCreatedAt(n.getCreatedAt() == null ? null
                : n.getCreatedAt().atZone(ZoneId.systemDefault()).toOffsetDateTime());
        return res;
    }

    private static String mapTypeToFrontend(NotificationType type) {
        if (type == null) return "workflow";
        return switch (type) {
            case MENTION -> "mention";
            case ASSIGNED -> "assignment";
            case STATUS_CHANGED -> "workflow";
            case APPROVAL_REQUESTED, APPROVAL_RESULT -> "approval";
            case INVITE_RECEIVED, INVITE_RESPONDED -> "invite";
        };
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getType() { return type; }
    public void setType(String type) { this.type = type; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }

    public String getLink() { return link; }
    public void setLink(String link) { this.link = link; }

    // Jackson mặc định đổi getter isRead() thành khóa JSON "read"; frontend và API_DOCUMENTATION dùng "isRead".
    @JsonProperty("isRead")
    public boolean isRead() { return isRead; }
    public void setRead(boolean read) { isRead = read; }

    public String getData() { return data; }
    public void setData(String data) { this.data = data; }

    public String getSourceId() { return sourceId; }
    public void setSourceId(String sourceId) { this.sourceId = sourceId; }

    public UserResponse getSender() { return sender; }
    public void setSender(UserResponse sender) { this.sender = sender; }

    public OffsetDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(OffsetDateTime createdAt) { this.createdAt = createdAt; }
}
