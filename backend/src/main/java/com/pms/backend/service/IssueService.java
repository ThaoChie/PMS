package com.pms.backend.service;

import com.pms.backend.hibernateDao.IssueBoardDao;
import com.pms.backend.dao.UserRepository;
import com.pms.backend.dao.WorkflowStatusRepository;
import com.pms.backend.exception.BusinessException;
import com.pms.backend.exception.ResourceNotFoundException;
import com.pms.backend.exception.ValidationException;
import com.pms.backend.model.Issue;
import com.pms.backend.model.User;
import com.pms.backend.model.WorkflowStatus;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class IssueService {

    private final IssueBoardDao issueBoardDao;
    private final UserRepository userRepository;
    private final WorkflowStatusRepository statusRepository;
    private final WorkflowService workflowService;

    public IssueService(IssueBoardDao issueBoardDao, UserRepository userRepository, WorkflowStatusRepository statusRepository, WorkflowService workflowService) {
        this.issueBoardDao = issueBoardDao;
        this.userRepository = userRepository;
        this.statusRepository = statusRepository;
        this.workflowService = workflowService;
    }

    public Issue createIssue(Issue issue) {
        validateEpicCycle(issue);
        return issueBoardDao.saveIssue(issue);
    }
    
    private void validateEpicCycle(Issue issue) {
        // Validate Epic Link cycle
        if (issue.getEpicLink() != null) {
            Issue parent = issue.getEpicLink();
            while (parent != null) {
                if (parent.getId() != null && parent.getId().equals(issue.getId())) {
                    throw new BusinessException("Epic Link cycle detected");
                }
                parent = parent.getEpicLink();
            }
        }
    }

    public Issue getIssue(Long id) {
        return issueBoardDao.findIssueById(id).orElseThrow(() -> new ResourceNotFoundException("Issue not found"));
    }

    public List<Issue> getIssuesByProject(Long projectId) {
        return issueBoardDao.findIssuesByProjectId(projectId);
    }
    
    public List<Issue> getIssuesForUserBoard(Long userId, Long projectId) {
        return issueBoardDao.findIssuesForUserBoard(userId, projectId);
    }

    public Issue assignIssue(Long issueId, Long assigneeId) {
        Issue issue = getIssue(issueId);
        User assignee = userRepository.findById(assigneeId).orElseThrow(() -> new ResourceNotFoundException("User not found"));
        issue.setAssignee(assignee);
        return issueBoardDao.saveIssue(issue);
    }

    public Issue changeStatus(Long issueId, Long toStatusId, String rejectReason) {
        Issue issue = getIssue(issueId);
        if (issue.getStatus() != null && !workflowService.isValidTransition(issue.getStatus().getId(), toStatusId)) {
            throw new IllegalArgumentException("Invalid status transition");
        }
        
        // Validate reject reason
        WorkflowStatus newStatus = statusRepository.findById(toStatusId).orElseThrow(() -> new ResourceNotFoundException("Status not found"));
        if (newStatus.getName().equalsIgnoreCase("In Progress") && issue.getStatus().getName().equalsIgnoreCase("Pending Approval")) {
            if (rejectReason == null || rejectReason.trim().isEmpty()) {
                throw new ValidationException("Reject reason is required when rejecting approval");
            }
        }
        
        issue.setStatus(newStatus);
        return issueBoardDao.saveIssue(issue);
    }
}
