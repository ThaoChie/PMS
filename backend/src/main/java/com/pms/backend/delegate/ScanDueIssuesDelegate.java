package com.pms.backend.delegate;

import com.pms.backend.config.ApprovalProperties;
import com.pms.backend.dao.DueIssueReminderRepository;
import com.pms.backend.dao.ReminderLogRepository;
import com.pms.backend.enu.NotificationType;
import com.pms.backend.enu.StatusCategory;
import com.pms.backend.model.Issue;
import com.pms.backend.model.ReminderLog;
import com.pms.backend.service.interfaces.INotificationService;
import org.flowable.engine.delegate.DelegateExecution;
import org.flowable.engine.delegate.JavaDelegate;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

@Component("scanDueIssuesDelegate")
public class ScanDueIssuesDelegate implements JavaDelegate {

    private static final Logger log = LoggerFactory.getLogger(ScanDueIssuesDelegate.class);
    public static final String REMINDER_TYPE_ISSUE_DUE_DATE = "ISSUE_DUE_DATE";

    private final DueIssueReminderRepository dueIssueRepo;
    private final ReminderLogRepository reminderLogRepo;
    private final INotificationService notificationService;
    private final ApprovalProperties approvalProperties;

    public ScanDueIssuesDelegate(DueIssueReminderRepository dueIssueRepo,
                                 ReminderLogRepository reminderLogRepo,
                                 INotificationService notificationService,
                                 ApprovalProperties approvalProperties) {
        this.dueIssueRepo = dueIssueRepo;
        this.reminderLogRepo = reminderLogRepo;
        this.notificationService = notificationService;
        this.approvalProperties = approvalProperties;
    }

    @Override
    @Transactional
    public void execute(DelegateExecution execution) {
        int hoursBefore = approvalProperties != null ? approvalProperties.getDueDateReminderHoursBefore() : 24;
        LocalDate today = LocalDate.now();
        LocalDate targetDueDate = today.plusDays(Math.max(1, (hoursBefore + 23) / 24));

        log.info("Bắt đầu quét Issue sắp đến hạn (trong vòng {}h, trước hoặc bằng ngày {})...", hoursBefore, targetDueDate);

        List<Issue> dueIssues = dueIssueRepo.findDueIssuesBefore(StatusCategory.DONE, targetDueDate);
        log.info("Tìm thấy {} Issue chưa hoàn thành và sắp đến hạn.", dueIssues.size());

        int sentCount = 0;
        int skippedCount = 0;

        for (Issue issue : dueIssues) {
            if (issue.getAssignee() == null) {
                skippedCount++;
                continue;
            }

            // Chống gửi lặp trong ngày qua bảng reminder_log
            boolean alreadyReminded = reminderLogRepo.existsByTypeAndRefIdAndSentOn(
                    REMINDER_TYPE_ISSUE_DUE_DATE, issue.getId(), today);

            if (alreadyReminded) {
                log.debug("Issue #{} ({}) đã được gửi nhắc nhở hôm nay. Bỏ qua.", issue.getId(), issue.getIssueKey());
                skippedCount++;
                continue;
            }

            try {
                String title = "Nhắc nhở: Issue " + issue.getIssueKey() + " sắp đến hạn";
                String message = String.format("Công việc '%s' sắp đến hạn (hạn chót: %s). Vui lòng kiểm tra và cập nhật tiến độ.",
                        issue.getSummary(), issue.getDueDate());
                String link = "/projects/" + issue.getProject().getId() + "/issues/" + issue.getId();

                // Gửi thông báo đến người được giao (Assignee)
                notificationService.notify(
                        NotificationType.ASSIGNED,
                        List.of(issue.getAssignee()),
                        title,
                        message,
                        link,
                        null,
                        null
                );

                // Ghi nhận lịch sử gửi để chống lặp
                ReminderLog reminderLog = new ReminderLog(REMINDER_TYPE_ISSUE_DUE_DATE, issue.getId(), today);
                reminderLogRepo.save(reminderLog);
                sentCount++;
                log.info("Đã gửi thông báo nhắc hạn cho Issue #{} ({}) tới assignee: {}",
                        issue.getId(), issue.getIssueKey(), issue.getAssignee().getEmail());
            } catch (DataIntegrityViolationException dive) {
                log.warn("Issue #{} đã được ghi log nhắc nhở bởi luồng khác.", issue.getId());
                skippedCount++;
            } catch (Exception e) {
                log.error("Lỗi khi gửi nhắc hạn cho Issue #{}: {}", issue.getId(), e.getMessage(), e);
            }
        }

        log.info("Hoàn thành quét Issue đến hạn: đã gửi {} nhắc nhở, bỏ qua {}.", sentCount, skippedCount);
    }
}
