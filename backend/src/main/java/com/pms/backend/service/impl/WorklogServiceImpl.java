package com.pms.backend.service.impl;

import com.pms.backend.service.interfaces.*;

import com.pms.backend.dao.IssueRepository;
import com.pms.backend.dao.WorklogRepository;
import com.pms.backend.dto.CreateWorklogRequest;
import com.pms.backend.dto.WorklogResponse;
import com.pms.backend.enu.ErrorCode;
import com.pms.backend.exception.BusinessException;
import com.pms.backend.exception.ForbiddenException;
import com.pms.backend.exception.ResourceNotFoundException;
import com.pms.backend.exception.ValidationException;
import com.pms.backend.hibernateDao.IssueBoardDao;
import com.pms.backend.model.Issue;
import com.pms.backend.model.User;
import com.pms.backend.model.Worklog;
import com.pms.backend.security.ProjectSecurity;
import com.pms.backend.util.DurationParser;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class WorklogServiceImpl implements IWorklogService {

    private final WorklogRepository worklogRepository;
    private final IssueRepository issueRepository;
    private final IssueBoardDao issueBoardDao;
    private final ProjectSecurity projectSecurity;
    private final IWatcherService watcherService;
    private final IAuditService auditService;

    @Value("${app.worklog.auto-adjust-remaining:true}")
    private boolean autoAdjustRemaining = true;

    public WorklogServiceImpl(WorklogRepository worklogRepository,
                          IssueBoardDao issueBoardDao) {
        this.worklogRepository = worklogRepository;
        this.issueBoardDao = issueBoardDao;
        this.issueRepository = null;
        this.projectSecurity = null;
        this.watcherService = null;
        this.auditService = null;
    }

    @Autowired
    public WorklogServiceImpl(WorklogRepository worklogRepository,
                          IssueRepository issueRepository,
                          IssueBoardDao issueBoardDao,
                          ProjectSecurity projectSecurity,
                          IWatcherService watcherService,
                          IAuditService auditService) {
        this.worklogRepository = worklogRepository;
        this.issueRepository = issueRepository;
        this.issueBoardDao = issueBoardDao;
        this.projectSecurity = projectSecurity;
        this.watcherService = watcherService;
        this.auditService = auditService;
    }

    @Transactional(readOnly = true)
    public List<WorklogResponse> getWorklogs(String issueKey) {
        return worklogRepository.findByIssueKeyOrderByWorkDateDesc(issueKey)
                .stream()
                .map(WorklogResponse::from)
                .collect(Collectors.toList());
    }

    @Transactional
    public WorklogResponse logWork(String issueKey, CreateWorklogRequest request, User currentUser) {
        Issue issue = issueRepository.findByIssueKeyAndDeletedAtIsNull(issueKey)
                .orElseThrow(() -> new ResourceNotFoundException("Issue not found: " + issueKey));

        if (projectSecurity != null) {
            projectSecurity.assertProjectWritable(issue.getProject());
        }

        // Only assignee can log work (BR-COL-04)
        if (issue.getAssignee() == null || !issue.getAssignee().getId().equals(currentUser.getId())) {
            throw new ForbiddenException(ErrorCode.FORBIDDEN, "Chỉ người được giao việc mới có quyền ghi nhận thời gian làm việc");
        }

        // Parse time spent
        int spentMinutes = DurationParser.parseToMinutes(request.getTimeSpent());
        if (spentMinutes <= 0) {
            throw new ValidationException("Thời gian làm việc phải lớn hơn 0");
        }

        // Validate date <= today
        LocalDate workDate = request.getDate() != null ? request.getDate() : LocalDate.now();
        if (workDate.isAfter(LocalDate.now())) {
            throw new ValidationException("Ngày ghi nhận công việc không được vượt quá hôm nay");
        }

        // Auto adjust remaining estimate
        if (autoAdjustRemaining) {
            int currentRemaining = issue.getRemainingEstimateMin() != null ? issue.getRemainingEstimateMin() : 0;
            int newRemaining = Math.max(0, currentRemaining - spentMinutes);
            issue.setRemainingEstimateMin(newRemaining);
        }

        int currentSpent = issue.getTimeSpentMin() != null ? issue.getTimeSpentMin() : 0;
        issue.setTimeSpentMin(currentSpent + spentMinutes);

        issueRepository.save(issue);

        Worklog worklog = new Worklog(issue, currentUser, spentMinutes, workDate, request.getComment());
        Worklog saved = worklogRepository.save(worklog);

        // Auto watch hook (T3.07)
        if (watcherService != null) {
            watcherService.watchIssue(issue, currentUser);
        }

        if (auditService != null) {
            auditService.log("LOG_WORK", "ISSUE", issue.getId(), issue.getProject().getId(), issue.getIssueKey(),
                    "Ghi nhận " + DurationParser.formatMinutes(spentMinutes) + " cho " + issue.getIssueKey());
        }

        return WorklogResponse.from(saved);
    }

    /**
     * Backward-compatibility method for Sprint 2 unit tests
     */
    @Transactional
    public Worklog logWork(Worklog worklog) {
        Issue issue;
        if (issueBoardDao != null && worklog.getIssue() != null && worklog.getIssue().getId() != null) {
            issue = issueBoardDao.findIssueById(worklog.getIssue().getId())
                    .orElseThrow(() -> new ResourceNotFoundException("Issue not found"));
        } else if (issueRepository != null && worklog.getIssue() != null && worklog.getIssue().getId() != null) {
            issue = issueRepository.findById(worklog.getIssue().getId())
                    .orElseThrow(() -> new ResourceNotFoundException("Issue not found"));
        } else {
            issue = worklog.getIssue();
        }

        int spent = worklog.getTimeSpentMin() != null ? worklog.getTimeSpentMin() :
                (worklog.getTimeSpent() != null ? worklog.getTimeSpent() : 0);

        int currentRemaining = issue.getRemainingEstimate() != null ? issue.getRemainingEstimate() : 0;
        int newRemaining = Math.max(0, currentRemaining - spent);
        issue.setRemainingEstimate(newRemaining);

        if (issueBoardDao != null) {
            issueBoardDao.saveIssue(issue);
        } else if (issueRepository != null) {
            issueRepository.save(issue);
        }

        return worklogRepository.save(worklog);
    }
}
