package com.pms.backend.service;

import com.pms.backend.dao.WorklogRepository;
import com.pms.backend.hibernateDao.IssueBoardDao;
import com.pms.backend.exception.ResourceNotFoundException;
import com.pms.backend.model.Issue;
import com.pms.backend.model.Worklog;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class WorklogService {
    private final WorklogRepository worklogRepository;
    private final IssueBoardDao issueBoardDao;

    public WorklogService(WorklogRepository worklogRepository, IssueBoardDao issueBoardDao) {
        this.worklogRepository = worklogRepository;
        this.issueBoardDao = issueBoardDao;
    }

    @Transactional
    public Worklog logWork(Worklog worklog) {
        Issue issue = issueBoardDao.findIssueById(worklog.getIssue().getId())
                .orElseThrow(() -> new ResourceNotFoundException("Issue not found"));
        
        // Cập nhật realtime Remaining Estimate (Sprint 4 validation)
        int newRemaining = issue.getRemainingEstimate() != null ? issue.getRemainingEstimate() - worklog.getTimeSpent() : 0;
        if (newRemaining < 0) newRemaining = 0;
        issue.setRemainingEstimate(newRemaining);
        issueBoardDao.saveIssue(issue);
        
        return worklogRepository.save(worklog);
    }
}
