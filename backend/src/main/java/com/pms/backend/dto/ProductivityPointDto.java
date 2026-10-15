package com.pms.backend.dto;

public class ProductivityPointDto {
    private String member;
    private int completed;
    private int inProgress;
    private int velocity;

    public ProductivityPointDto() {}

    public ProductivityPointDto(String member, int completed, int inProgress, int velocity) {
        this.member = member;
        this.completed = completed;
        this.inProgress = inProgress;
        this.velocity = velocity;
    }

    public String getMember() { return member; }
    public void setMember(String member) { this.member = member; }
    public int getCompleted() { return completed; }
    public void setCompleted(int completed) { this.completed = completed; }
    public int getInProgress() { return inProgress; }
    public void setInProgress(int inProgress) { this.inProgress = inProgress; }
    public int getVelocity() { return velocity; }
    public void setVelocity(int velocity) { this.velocity = velocity; }
}
