package com.pms.backend.service.impl;

import com.pms.backend.service.interfaces.*;

import com.pms.backend.dao.IssueRepository;
import com.pms.backend.dto.*;
import com.pms.backend.hibernateDao.BugReportHibernateDao;
import com.pms.backend.hibernateDao.ProductivityReportHibernateDao;
import com.pms.backend.hibernateDao.ProgressReportHibernateDao;
import com.pms.backend.model.Issue;
import com.pms.backend.security.ProjectSecurity;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.*;

@Service
@Transactional(readOnly = true)
public class ReportServiceImpl implements IReportService {

    private final IssueRepository issueRepository;
    private final ProgressReportHibernateDao progressReportHibernateDao;
    private final ProductivityReportHibernateDao productivityReportHibernateDao;
    private final BugReportHibernateDao bugReportHibernateDao;
    private final ProjectSecurity projectSecurity;

    public ReportServiceImpl(IssueRepository issueRepository,
                         ProgressReportHibernateDao progressReportHibernateDao,
                         ProductivityReportHibernateDao productivityReportHibernateDao,
                         BugReportHibernateDao bugReportHibernateDao,
                         ProjectSecurity projectSecurity) {
        this.issueRepository = issueRepository;
        this.progressReportHibernateDao = progressReportHibernateDao;
        this.productivityReportHibernateDao = productivityReportHibernateDao;
        this.bugReportHibernateDao = bugReportHibernateDao;
        this.projectSecurity = projectSecurity;
    }

    public ProgressReportResponse getProgressReport(Long projectId, LocalDate from, LocalDate to, String metric) {
        return progressReportHibernateDao.generateProgressReport(projectId, from, to, metric);
    }

    public ProductivityReportResponse getProductivityReport(Long projectId, LocalDate from, LocalDate to) {
        boolean isPmOrAdmin = projectSecurity.isPmOrAdmin(projectId);
        return productivityReportHibernateDao.generateProductivityReport(projectId, from, to, isPmOrAdmin);
    }

    public BugReportResponse getBugReport(Long projectId, LocalDate from, LocalDate to) {
        return bugReportHibernateDao.generateBugReport(projectId, from, to);
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
}
