package com.pms.backend.service;

import com.pms.backend.dao.IssueRepository;
import com.pms.backend.dto.ReportResponse;
import com.pms.backend.model.Issue;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class ReportService {

    private final IssueRepository issueRepository;

    public ReportService(IssueRepository issueRepository) {
        this.issueRepository = issueRepository;
    }

    public ReportResponse generateProjectReport(Long projectId) {
        List<Issue> issues = issueRepository.findByProjectId(projectId);
        
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
}
