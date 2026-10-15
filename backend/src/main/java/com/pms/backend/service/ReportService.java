package com.pms.backend.service;

import com.pms.backend.dao.IssueRepository;
import com.pms.backend.dto.*;
import com.pms.backend.enu.IssueType;
import com.pms.backend.enu.Priority;
import com.pms.backend.enu.StatusCategory;
import com.pms.backend.model.Issue;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.*;

@Service
public class ReportService {

    private final IssueRepository issueRepository;

    public ReportService(IssueRepository issueRepository) {
        this.issueRepository = issueRepository;
    }

    public ReportResponse generateProjectReport(Long projectId) {
        List<Issue> issues = issueRepository.findByProjectIdAndDeletedAtIsNull(projectId);

        Map<String, Integer> statusCount = new HashMap<>();
        Map<String, Integer> assigneeCount = new HashMap<>();

        for (Issue issue : issues) {
            String statusName = issue.getStatus() != null ? issue.getStatus().getName() : "Unassigned Status";
            statusCount.put(statusName, statusCount.getOrDefault(statusName, 0) + 1);

            String assigneeName = issue.getAssignee() != null ? issue.getAssignee().getFullName() : "Unassigned";
            assigneeCount.put(assigneeName, assigneeCount.getOrDefault(assigneeName, 0) + 1);
        }

        ReportResponse report = new ReportResponse();
        report.setIssueCountByStatus(statusCount);
        report.setIssueCountByAssignee(assigneeCount);
        return report;
    }

    public List<ProgressPointDto> getProgressReport(Long projectId) {
        List<Issue> issues = issueRepository.findByProjectIdAndDeletedAtIsNull(projectId);
        if (issues.isEmpty()) {
            return Collections.emptyList();
        }

        int total = issues.size();
        int completed = (int) issues.stream()
                .filter(i -> i.getStatus() != null && i.getStatus().getCategory() == StatusCategory.DONE)
                .count();
        int remaining = total - completed;

        List<ProgressPointDto> points = new ArrayList<>();
        DateTimeFormatter fmt = DateTimeFormatter.ofPattern("dd/MM");
        LocalDate now = LocalDate.now();

        // 7-day projection timeline
        for (int i = 6; i >= 0; i--) {
            LocalDate d = now.minusDays(i);
            String label = d.format(fmt);
            // Linear ideal from total down to 0
            int ideal = Math.max(0, (int) Math.round((double) total * i / 6.0));
            // Actual for today vs earlier
            int currRemaining = (i == 0) ? remaining : Math.min(total, remaining + i);
            int currCompleted = (i == 0) ? completed : Math.max(0, total - currRemaining);

            points.add(new ProgressPointDto(label, currRemaining, currCompleted, ideal));
        }

        return points;
    }

    public List<ProductivityPointDto> getProductivityReport(Long projectId) {
        List<Issue> issues = issueRepository.findByProjectIdAndDeletedAtIsNull(projectId);
        if (issues.isEmpty()) {
            return Collections.emptyList();
        }

        Map<String, int[]> statsByMember = new LinkedHashMap<>();

        for (Issue issue : issues) {
            String name = issue.getAssignee() != null ? issue.getAssignee().getFullName() : "Chưa phân công";
            statsByMember.putIfAbsent(name, new int[2]); // [completed, inProgress]
            int[] counts = statsByMember.get(name);

            if (issue.getStatus() != null && issue.getStatus().getCategory() == StatusCategory.DONE) {
                counts[0]++;
            } else {
                counts[1]++;
            }
        }

        List<ProductivityPointDto> result = new ArrayList<>();
        for (Map.Entry<String, int[]> entry : statsByMember.entrySet()) {
            result.add(new ProductivityPointDto(
                    entry.getKey(),
                    entry.getValue()[0],
                    entry.getValue()[1],
                    entry.getValue()[0] // velocity
            ));
        }

        return result;
    }

    public List<BugReportItemDto> getBugReport(Long projectId) {
        List<Issue> issues = issueRepository.findByProjectIdAndDeletedAtIsNull(projectId);
        List<Issue> bugs = issues.stream()
                .filter(i -> i.getType() == IssueType.BUG)
                .toList();

        if (bugs.isEmpty()) {
            return Collections.emptyList();
        }

        Map<Priority, int[]> statsByPriority = new LinkedHashMap<>();
        for (Priority p : Priority.values()) {
            statsByPriority.put(p, new int[2]); // [resolved, unresolved]
        }

        for (Issue bug : bugs) {
            Priority p = bug.getPriority() != null ? bug.getPriority() : Priority.MEDIUM;
            int[] counts = statsByPriority.get(p);
            if (bug.getStatus() != null && bug.getStatus().getCategory() == StatusCategory.DONE) {
                counts[0]++;
            } else {
                counts[1]++;
            }
        }

        List<BugReportItemDto> result = new ArrayList<>();
        for (Map.Entry<Priority, int[]> entry : statsByPriority.entrySet()) {
            int resolved = entry.getValue()[0];
            int unresolved = entry.getValue()[1];
            if (resolved > 0 || unresolved > 0) {
                result.add(new BugReportItemDto(entry.getKey().name(), resolved, unresolved));
            }
        }

        return result;
    }
}
