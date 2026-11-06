package com.pms.backend.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

@Configuration
@ConfigurationProperties(prefix = "approval")
public class ApprovalProperties {

    private boolean projectCloseEnabled = false;
    private boolean workflowChangeEnabled = false;
    private int reminderAfterHours = 24;
    private int escalateAfterHours = 72;
    private int expireAfterDays = 14;
    private String dueDateReminderCron = "0 0 8 * * ?";
    private int dueDateReminderHoursBefore = 24;
    private String timeZone = "Asia/Ho_Chi_Minh";

    public boolean isProjectCloseEnabled() { return projectCloseEnabled; }
    public void setProjectCloseEnabled(boolean projectCloseEnabled) { this.projectCloseEnabled = projectCloseEnabled; }
    public boolean isWorkflowChangeEnabled() { return workflowChangeEnabled; }
    public void setWorkflowChangeEnabled(boolean workflowChangeEnabled) { this.workflowChangeEnabled = workflowChangeEnabled; }
    public int getReminderAfterHours() { return reminderAfterHours; }
    public void setReminderAfterHours(int reminderAfterHours) { this.reminderAfterHours = reminderAfterHours; }
    public int getEscalateAfterHours() { return escalateAfterHours; }
    public void setEscalateAfterHours(int escalateAfterHours) { this.escalateAfterHours = escalateAfterHours; }
    public int getExpireAfterDays() { return expireAfterDays; }
    public void setExpireAfterDays(int expireAfterDays) { this.expireAfterDays = expireAfterDays; }
    public String getDueDateReminderCron() { return dueDateReminderCron; }
    public void setDueDateReminderCron(String dueDateReminderCron) { this.dueDateReminderCron = dueDateReminderCron; }
    public int getDueDateReminderHoursBefore() { return dueDateReminderHoursBefore; }
    public void setDueDateReminderHoursBefore(int dueDateReminderHoursBefore) { this.dueDateReminderHoursBefore = dueDateReminderHoursBefore; }
    public String getTimeZone() { return timeZone; }
    public void setTimeZone(String timeZone) { this.timeZone = timeZone; }
}
