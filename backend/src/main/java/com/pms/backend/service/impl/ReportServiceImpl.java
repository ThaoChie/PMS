package com.pms.backend.service.impl;

import com.pms.backend.dao.IssueRepository;
import com.pms.backend.dao.ProjectMemberRepository;
import com.pms.backend.dao.ProjectRepository;
import com.pms.backend.dto.*;
import com.pms.backend.enu.ErrorCode;
import com.pms.backend.exception.BusinessException;
import com.pms.backend.exception.ForbiddenException;
import com.pms.backend.hibernateDao.BugReportHibernateDao;
import com.pms.backend.hibernateDao.ProductivityReportHibernateDao;
import com.pms.backend.hibernateDao.ProgressReportHibernateDao;
import com.pms.backend.model.Issue;
import com.pms.backend.model.Project;
import com.pms.backend.model.User;
import com.pms.backend.model.Worklog;
import com.pms.backend.security.ProjectSecurity;
import com.pms.backend.service.interfaces.IExportService;
import com.pms.backend.service.interfaces.IReportService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.*;

@Service
@Transactional(readOnly = true)
public class ReportServiceImpl implements IReportService {

    private final IssueRepository issueRepository;
    private final ProgressReportHibernateDao progressReportHibernateDao;
    private final ProductivityReportHibernateDao productivityReportHibernateDao;
    private final BugReportHibernateDao bugReportHibernateDao;
    private final ProjectSecurity projectSecurity;
    private final ProjectRepository projectRepository;
    private final ProjectMemberRepository projectMemberRepository;
    private final IExportService exportService;

    public ReportServiceImpl(IssueRepository issueRepository,
                             ProgressReportHibernateDao progressReportHibernateDao,
                             ProductivityReportHibernateDao productivityReportHibernateDao,
                             BugReportHibernateDao bugReportHibernateDao,
                             ProjectSecurity projectSecurity) {
        this(issueRepository, progressReportHibernateDao, productivityReportHibernateDao, bugReportHibernateDao, projectSecurity, null, null, null);
    }

    @Autowired
    public ReportServiceImpl(IssueRepository issueRepository,
                             ProgressReportHibernateDao progressReportHibernateDao,
                             ProductivityReportHibernateDao productivityReportHibernateDao,
                             BugReportHibernateDao bugReportHibernateDao,
                             ProjectSecurity projectSecurity,
                             ProjectRepository projectRepository,
                             ProjectMemberRepository projectMemberRepository,
                             IExportService exportService) {
        this.issueRepository = issueRepository;
        this.progressReportHibernateDao = progressReportHibernateDao;
        this.productivityReportHibernateDao = productivityReportHibernateDao;
        this.bugReportHibernateDao = bugReportHibernateDao;
        this.projectSecurity = projectSecurity;
        this.projectRepository = projectRepository;
        this.projectMemberRepository = projectMemberRepository;
        this.exportService = exportService;
    }

    @Override
    public ProgressReportResponse getProgressReport(Long projectId, LocalDate from, LocalDate to, String metric) {
        // Chỉ có 2 đơn vị: số lượng công việc (issues) hoặc giờ (hours)
        if (metric != null && !metric.isBlank()
                && !"issues".equalsIgnoreCase(metric.trim()) && !"hours".equalsIgnoreCase(metric.trim())) {
            throw new BusinessException(
                    ErrorCode.VALIDATION_ERROR,
                    "Đơn vị báo cáo không hợp lệ, chỉ chấp nhận issues hoặc hours");
        }
        return progressReportHibernateDao.generateProgressReport(projectId, from, to, metric);
    }

    @Override
    public ProductivityReportResponse getProductivityReport(Long projectId, LocalDate from, LocalDate to) {
        boolean isPmOrAdmin = projectSecurity.isPmOrAdmin(projectId);
        return productivityReportHibernateDao.generateProductivityReport(projectId, from, to, isPmOrAdmin);
    }

    @Override
    public ProductivityReportResponse getProductivityReport(Long projectId, ProductivityFilterRequest filter) {
        if (!projectSecurity.isPmOrAdmin(projectId)) {
            throw new ForbiddenException(ErrorCode.FORBIDDEN, "Chỉ Quản lý dự án hoặc Quản trị viên mới có quyền xem báo cáo năng suất");
        }
        validateFilter(projectId, filter);
        return productivityReportHibernateDao.generateProductivityReport(projectId, filter, true);
    }

    @Override
    public MemberDetailProductivityResponse getMemberProductivityDetail(Long projectId, Long userId, ProductivityFilterRequest filter) {
        if (!projectSecurity.isPmOrAdmin(projectId)) {
            throw new ForbiddenException(ErrorCode.FORBIDDEN, "Chỉ Quản lý dự án hoặc Quản trị viên mới có quyền xem chi tiết năng suất thành viên");
        }
        validateFilter(projectId, filter);
        return productivityReportHibernateDao.getMemberProductivityDetail(projectId, userId, filter);
    }

    @Override
    public byte[] exportProductivityReport(Long projectId, ProductivityFilterRequest filter, User currentUser) {
        if (!projectSecurity.isPmOrAdmin(projectId)) {
            throw new ForbiddenException(ErrorCode.FORBIDDEN, "Chỉ Quản lý dự án hoặc Quản trị viên mới có quyền xuất báo cáo năng suất");
        }
        validateFilter(projectId, filter);

        ProductivityReportResponse report = productivityReportHibernateDao.generateProductivityReport(projectId, filter, true);
        List<Issue> issues = productivityReportHibernateDao.fetchIssuesForExport(projectId, filter);
        List<Worklog> worklogs = productivityReportHibernateDao.fetchWorklogsForExport(projectId, filter);

        Project project = projectRepository != null ? projectRepository.findById(projectId).orElse(null) : null;
        if (project == null) {
            project = new Project();
            project.setId(projectId);
            project.setName("Project " + projectId);
            project.setProjectKey("PRJ-" + projectId);
        }

        return exportService.generateProductivityExcel(project, report, issues, worklogs, filter, currentUser);
    }

    @Override
    public BugReportResponse getBugReport(Long projectId, LocalDate from, LocalDate to) {
        return bugReportHibernateDao.generateBugReport(projectId, from, to);
    }

    @Override
    public ReportResponse generateProjectReport(Long projectId) {
        List<Object[]> statusRows = issueRepository.countIssuesByStatusGrouped(projectId);
        Map<String, Integer> statusCount = new HashMap<>();
        for (Object[] row : statusRows) {
            String statusName = (String) row[0];
            Number count = (Number) row[1];
            statusCount.put(statusName, count.intValue());
        }

        List<Object[]> assigneeRows = issueRepository.countIssuesByAssigneeGrouped(projectId);
        Map<String, Integer> assigneeCount = new HashMap<>();
        for (Object[] row : assigneeRows) {
            String assigneeName = (String) row[0];
            Number count = (Number) row[1];
            assigneeCount.put(assigneeName, count.intValue());
        }

        ReportResponse report = new ReportResponse();
        report.setIssueCountByStatus(statusCount);
        report.setIssueCountByAssignee(assigneeCount);
        return report;
    }

    private void validateFilter(Long projectId, ProductivityFilterRequest filter) {
        if (filter == null) return;

        LocalDate from = filter.getFrom();
        LocalDate to = filter.getTo();

        if (from != null && to != null) {
            if (from.isAfter(to)) {
                throw new BusinessException(ErrorCode.VALIDATION_ERROR, "Ngày bắt đầu không được lớn hơn ngày kết thúc");
            }
            long days = ChronoUnit.DAYS.between(from, to);
            if (days > 366) {
                throw new BusinessException(ErrorCode.VALIDATION_ERROR, "Khoảng thời gian lọc không được vượt quá 366 ngày");
            }
        }

        if (filter.getMemberIds() != null && !filter.getMemberIds().isEmpty() && projectMemberRepository != null) {
            for (Long memberId : filter.getMemberIds()) {
                if (memberId != null && !projectMemberRepository.existsByProjectIdAndUserId(projectId, memberId)) {
                    throw new BusinessException(ErrorCode.VALIDATION_ERROR, "Thành viên có ID " + memberId + " không thuộc dự án này");
                }
            }
        }
    }
}
