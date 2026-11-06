package com.pms.backend.model;

import jakarta.persistence.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "reminder_log", uniqueConstraints = {
        @UniqueConstraint(name = "uk_reminder_log", columnNames = {"type", "ref_id", "sent_on"})
})
public class ReminderLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 50)
    private String type;

    @Column(name = "ref_id", nullable = false)
    private Long refId;

    @Column(name = "sent_on", nullable = false)
    private LocalDate sentOn;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    public ReminderLog() {
    }

    public ReminderLog(String type, Long refId, LocalDate sentOn) {
        this.type = type;
        this.refId = refId;
        this.sentOn = sentOn;
        this.createdAt = LocalDateTime.now();
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getType() { return type; }
    public void setType(String type) { this.type = type; }
    public Long getRefId() { return refId; }
    public void setRefId(Long refId) { this.refId = refId; }
    public LocalDate getSentOn() { return sentOn; }
    public void setSentOn(LocalDate sentOn) { this.sentOn = sentOn; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
