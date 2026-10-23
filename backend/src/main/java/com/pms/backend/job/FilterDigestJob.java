package com.pms.backend.job;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.pms.backend.dao.FilterSubscriptionRepository;
import com.pms.backend.dao.ProjectMemberRepository;
import com.pms.backend.dto.IssueSearchRequest;
import com.pms.backend.hibernateDao.IssueSearchDao;
import com.pms.backend.model.FilterSubscription;
import com.pms.backend.model.Issue;
import com.pms.backend.model.ProjectMember;
import com.pms.backend.model.User;
import com.pms.backend.service.interfaces.IMailService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Component
public class FilterDigestJob {

    private static final Logger log = LoggerFactory.getLogger(FilterDigestJob.class);

    private final FilterSubscriptionRepository subscriptionRepository;
    private final IssueSearchDao issueSearchDao;
    private final ProjectMemberRepository projectMemberRepository;
    private final IMailService mailService;
    private final ObjectMapper objectMapper;

    public FilterDigestJob(FilterSubscriptionRepository subscriptionRepository,
                           IssueSearchDao issueSearchDao,
                           ProjectMemberRepository projectMemberRepository,
                           IMailService mailService,
                           ObjectMapper objectMapper) {
        this.subscriptionRepository = subscriptionRepository;
        this.issueSearchDao = issueSearchDao;
        this.projectMemberRepository = projectMemberRepository;
        this.mailService = mailService;
        this.objectMapper = objectMapper;
    }

    @Scheduled(cron = "${app.digest.cron:0 0 * * * *}") // Runs hourly by default
    @Transactional
    public void executeDueSubscriptions() {
        LocalDateTime now = LocalDateTime.now();
        List<FilterSubscription> dueSubs = subscriptionRepository.findDueSubscriptions(now);

        if (dueSubs.isEmpty()) {
            return;
        }

        log.info("Processing {} due filter subscriptions for digest emails", dueSubs.size());

        for (FilterSubscription sub : dueSubs) {
            try {
                processSubscription(sub, now);
            } catch (Exception e) {
                log.error("Failed to process digest for subscription ID {}", sub.getId(), e);
            }
        }
    }

    public void processSubscription(FilterSubscription sub, LocalDateTime now) {
        User user = sub.getUser();
        if (user == null || user.getEmail() == null || user.getEmail().isBlank()) {
            return;
        }

        // Evaluate criteria strictly under subscriber's current project permissions (BR-SRCH-03)
        List<Long> accessibleProjectIds = projectMemberRepository.findByUserId(user.getId())
                .stream()
                .map(pm -> pm.getProject().getId())
                .collect(Collectors.toList());

        IssueSearchRequest searchReq = new IssueSearchRequest();
        String criteriaStr = sub.getFilter().getCriteria();
        if (criteriaStr != null && !criteriaStr.isBlank()) {
            try {
                searchReq = objectMapper.readValue(criteriaStr, IssueSearchRequest.class);
            } catch (Exception e) {
                log.warn("Could not deserialize criteria for filter ID {}: {}", sub.getFilter().getId(), criteriaStr);
            }
        }

        List<Issue> issues = issueSearchDao.searchIssues(searchReq, accessibleProjectIds, user.getId(), null);

        // Format message
        StringBuilder summaryBuilder = new StringBuilder();
        summaryBuilder.append("Bộ lọc '").append(sub.getFilter().getName()).append("' có ")
                .append(issues.size()).append(" công việc phù hợp:\n\n");

        int displayLimit = Math.min(issues.size(), 10);
        for (int i = 0; i < displayLimit; i++) {
            Issue issue = issues.get(i);
            summaryBuilder.append("- [").append(issue.getIssueKey()).append("] ")
                    .append(issue.getSummary())
                    .append(" (").append(issue.getStatus() != null ? issue.getStatus().getName() : "N/A").append(")\n");
        }
        if (issues.size() > displayLimit) {
            summaryBuilder.append("\n... và ").append(issues.size() - displayLimit).append(" công việc khác.");
        }

        // Send digest email
        mailService.sendMailAsync(
                user.getEmail(),
                "[EPMS Digest] Cập nhật bộ lọc: " + sub.getFilter().getName(),
                "notification",
                Map.of(
                        "recipientName", user.getFullName(),
                        "title", "Cập nhật định kỳ: " + sub.getFilter().getName(),
                        "message", summaryBuilder.toString(),
                        "link", "/issues"
                )
        );

        // Update next_run_at
        LocalDateTime nextRun = "WEEKLY".equalsIgnoreCase(sub.getFrequency()) ?
                now.plusDays(7) : now.plusDays(1);
        sub.setNextRunAt(nextRun);
        sub.setUpdatedAt(now);
        subscriptionRepository.save(sub);
    }
}
