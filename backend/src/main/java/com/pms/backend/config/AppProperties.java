package com.pms.backend.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

import java.util.List;

@Configuration
@ConfigurationProperties(prefix = "app")
public class AppProperties {

    private Jwt jwt = new Jwt();
    private Upload upload = new Upload();
    private Export export = new Export();
    private Invitation invitation = new Invitation();
    private Notification notification = new Notification();
    private Mail mail = new Mail();
    private Productivity productivity = new Productivity();
    private String frontendUrl = "https://pms-chi-self.vercel.app";

    public static class Productivity {
        private double dailyStandardHours = 8.0;
        private double weeklyStandardHours = 40.0;
        private double underloadRatio = 0.70;
        private double overloadRatio = 1.15;
        private int maxInProgressIssues = 5;

        public double getDailyStandardHours() { return dailyStandardHours; }
        public void setDailyStandardHours(double dailyStandardHours) { this.dailyStandardHours = dailyStandardHours; }
        public double getWeeklyStandardHours() { return weeklyStandardHours; }
        public void setWeeklyStandardHours(double weeklyStandardHours) { this.weeklyStandardHours = weeklyStandardHours; }
        public double getUnderloadRatio() { return underloadRatio; }
        public void setUnderloadRatio(double underloadRatio) { this.underloadRatio = underloadRatio; }
        public double getOverloadRatio() { return overloadRatio; }
        public void setOverloadRatio(double overloadRatio) { this.overloadRatio = overloadRatio; }
        public int getMaxInProgressIssues() { return maxInProgressIssues; }
        public void setMaxInProgressIssues(int maxInProgressIssues) { this.maxInProgressIssues = maxInProgressIssues; }
    }

    public static class Jwt {
        private String secret = "404E635266556A586E3272357538782F413F4428472B4B6250645367566B5970";
        private long accessTokenExpirationMs = 1800000; // 30 min
        private long refreshTokenExpirationMs = 604800000; // 7 days

        public String getSecret() { return secret; }
        public void setSecret(String secret) { this.secret = secret; }
        public long getAccessTokenExpirationMs() { return accessTokenExpirationMs; }
        public void setAccessTokenExpirationMs(long accessTokenExpirationMs) { this.accessTokenExpirationMs = accessTokenExpirationMs; }
        public long getRefreshTokenExpirationMs() { return refreshTokenExpirationMs; }
        public void setRefreshTokenExpirationMs(long refreshTokenExpirationMs) { this.refreshTokenExpirationMs = refreshTokenExpirationMs; }
    }

    public static class Upload {
        private long maxFileSize = 10485760; // 10MB
        private long maxIssueSize = 52428800; // 50MB
        private List<String> allowedContentTypes = List.of("image/jpeg", "image/png", "image/gif", "image/webp", "application/pdf");

        public long getMaxFileSize() { return maxFileSize; }
        public void setMaxFileSize(long maxFileSize) { this.maxFileSize = maxFileSize; }
        public long getMaxIssueSize() { return maxIssueSize; }
        public void setMaxIssueSize(long maxIssueSize) { this.maxIssueSize = maxIssueSize; }
        public List<String> getAllowedContentTypes() { return allowedContentTypes; }
        public void setAllowedContentTypes(List<String> allowedContentTypes) { this.allowedContentTypes = allowedContentTypes; }
    }

    public static class Export {
        private int maxRows = 10000;

        public int getMaxRows() { return maxRows; }
        public void setMaxRows(int maxRows) { this.maxRows = maxRows; }
    }

    public static class Invitation {
        private int expiryDays = 7;
        private int maxPerMinutePerUser = 10;
        private int maxPerHourPerProject = 30;

        public int getExpiryDays() { return expiryDays; }
        public void setExpiryDays(int expiryDays) { this.expiryDays = expiryDays; }
        public int getMaxPerMinutePerUser() { return maxPerMinutePerUser; }
        public void setMaxPerMinutePerUser(int maxPerMinutePerUser) { this.maxPerMinutePerUser = maxPerMinutePerUser; }
        public int getMaxPerHourPerProject() { return maxPerHourPerProject; }
        public void setMaxPerHourPerProject(int maxPerHourPerProject) { this.maxPerHourPerProject = maxPerHourPerProject; }
    }

    public static class Notification {
        private int retentionDays = 30;

        public int getRetentionDays() { return retentionDays; }
        public void setRetentionDays(int retentionDays) { this.retentionDays = retentionDays; }
    }

    public static class Mail {
        private String from = "no-reply@epms.com";

        public String getFrom() { return from; }
        public void setFrom(String from) { this.from = from; }
    }

    public Jwt getJwt() { return jwt; }
    public void setJwt(Jwt jwt) { this.jwt = jwt; }
    public Upload getUpload() { return upload; }
    public void setUpload(Upload upload) { this.upload = upload; }
    public Export getExport() { return export; }
    public void setExport(Export export) { this.export = export; }
    public Invitation getInvitation() { return invitation; }
    public void setInvitation(Invitation invitation) { this.invitation = invitation; }
    public Notification getNotification() { return notification; }
    public void setNotification(Notification notification) { this.notification = notification; }
    public Mail getMail() { return mail; }
    public void setMail(Mail mail) { this.mail = mail; }
    public Productivity getProductivity() { return productivity; }
    public void setProductivity(Productivity productivity) { this.productivity = productivity; }
    public String getFrontendUrl() { return frontendUrl; }
    public void setFrontendUrl(String frontendUrl) { this.frontendUrl = frontendUrl; }
}
