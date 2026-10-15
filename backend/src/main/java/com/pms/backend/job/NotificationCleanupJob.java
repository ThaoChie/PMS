package com.pms.backend.job;

import com.pms.backend.config.AppProperties;
import com.pms.backend.dao.NotificationRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Component
public class NotificationCleanupJob {

    private static final Logger log = LoggerFactory.getLogger(NotificationCleanupJob.class);

    private final NotificationRepository notificationRepository;
    private final AppProperties appProperties;

    public NotificationCleanupJob(NotificationRepository notificationRepository, AppProperties appProperties) {
        this.notificationRepository = notificationRepository;
        this.appProperties = appProperties;
    }

    /**
     * Cleans up notifications older than retention days (minimum 30 days per BR-COL-05).
     * Runs daily at 2:00 AM.
     */
    @Scheduled(cron = "0 0 2 * * *")
    @Transactional
    public void cleanupOldNotifications() {
        int retentionDays = appProperties.getNotification().getRetentionDays();
        if (retentionDays < 30) {
            log.warn("Retention days configured ({}) is less than minimum 30 days. Enforcing 30 days.", retentionDays);
            retentionDays = 30;
        }

        LocalDateTime threshold = LocalDateTime.now().minusDays(retentionDays);
        int deletedCount = notificationRepository.deleteOlderThan(threshold);
        log.info("NotificationCleanupJob executed: purged {} notifications older than {} days (before {})",
                deletedCount, retentionDays, threshold);
    }
}
