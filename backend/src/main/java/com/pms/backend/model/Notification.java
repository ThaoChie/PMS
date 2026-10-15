package com.pms.backend.model;

import com.pms.backend.common.BaseEntity;
import com.pms.backend.enu.NotificationType;
import jakarta.persistence.*;

@Entity
@Table(name = "notifications")
public class Notification extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "recipient_id", nullable = false)
    private User recipient;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "sender_id")
    private User sender;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private NotificationType type = NotificationType.STATUS_CHANGED;

    @Column(nullable = false)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String message;

    private String link;

    @Column(name = "is_read", nullable = false)
    private boolean isRead = false;

    @Column(columnDefinition = "TEXT")
    private String data;

    public User getRecipient() { return recipient; }
    public void setRecipient(User recipient) { this.recipient = recipient; }
    public User getUser() { return recipient; }
    public void setUser(User user) { this.recipient = user; }

    public User getSender() { return sender; }
    public void setSender(User sender) { this.sender = sender; }

    public NotificationType getType() { return type; }
    public void setType(NotificationType type) { this.type = type; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }
    public String getContent() { return message; }
    public void setContent(String content) { this.message = content; }

    public String getLink() { return link; }
    public void setLink(String link) { this.link = link; }

    public boolean isRead() { return isRead; }
    public void setRead(boolean read) { isRead = read; }

    public String getData() { return data; }
    public void setData(String data) { this.data = data; }
}
