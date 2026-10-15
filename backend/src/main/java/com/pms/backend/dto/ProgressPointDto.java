package com.pms.backend.dto;

public class ProgressPointDto {
    private String day;
    private String date;
    private Integer ideal;
    private Integer idealRemaining;
    private Integer actualRemaining;
    private Integer remaining;
    private Integer completed;

    public ProgressPointDto() {}

    public ProgressPointDto(String day, Integer remaining, Integer completed, Integer ideal) {
        this.day = day;
        this.date = day;
        this.remaining = remaining;
        this.actualRemaining = remaining;
        this.completed = completed;
        this.ideal = ideal;
        this.idealRemaining = ideal;
    }

    public String getDay() { return day; }
    public void setDay(String day) { this.day = day; this.date = day; }
    public String getDate() { return date; }
    public void setDate(String date) { this.date = date; this.day = date; }
    public Integer getIdeal() { return ideal; }
    public void setIdeal(Integer ideal) { this.ideal = ideal; this.idealRemaining = ideal; }
    public Integer getIdealRemaining() { return idealRemaining; }
    public void setIdealRemaining(Integer idealRemaining) { this.idealRemaining = idealRemaining; this.ideal = idealRemaining; }
    public Integer getActualRemaining() { return actualRemaining; }
    public void setActualRemaining(Integer actualRemaining) { this.actualRemaining = actualRemaining; this.remaining = actualRemaining; }
    public Integer getRemaining() { return remaining; }
    public void setRemaining(Integer remaining) { this.remaining = remaining; this.actualRemaining = remaining; }
    public Integer getCompleted() { return completed; }
    public void setCompleted(Integer completed) { this.completed = completed; }
}
