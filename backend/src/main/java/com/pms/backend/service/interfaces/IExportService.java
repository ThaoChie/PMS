package com.pms.backend.service.interfaces;

import com.pms.backend.dto.IssueSearchRequest;
import com.pms.backend.model.Issue;

import java.util.List;

public interface IExportService {
    byte[] exportIssues(IssueSearchRequest request, String format, List<Long> accessibleProjectIds, Long currentUserId, List<Long> recentlyViewedIds);
    byte[] generateCsv(List<Issue> issues);
    byte[] generateExcel(List<Issue> issues);
    byte[] exportToCsv(List<Issue> issues);
}
