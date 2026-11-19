package com.pms.backend.service.interfaces;

import com.pms.backend.dto.IssueSearchRequest;
import com.pms.backend.dto.ProductivityFilterRequest;
import com.pms.backend.dto.ProductivityReportResponse;
import com.pms.backend.model.Issue;
import com.pms.backend.model.Project;
import com.pms.backend.model.User;
import com.pms.backend.model.Worklog;

import java.util.List;

public interface IExportService {
    byte[] exportIssues(IssueSearchRequest request, String format, List<Long> accessibleProjectIds, Long currentUserId, List<Long> recentlyViewedIds);
    byte[] generateCsv(List<Issue> issues);
    byte[] generateExcel(List<Issue> issues);
    byte[] exportToCsv(List<Issue> issues);
    byte[] generateProductivityExcel(Project project, ProductivityReportResponse report, List<Issue> issues, List<Worklog> worklogs, ProductivityFilterRequest filter, User currentUser);
}
