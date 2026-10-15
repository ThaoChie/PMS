package com.pms.backend.service;

import com.pms.backend.dao.UserRepository;
import com.pms.backend.dao.WorkflowStatusRepository;
import com.pms.backend.hibernateDao.IssueBoardDao;
import com.pms.backend.exception.BusinessException;
import com.pms.backend.exception.ValidationException;
import com.pms.backend.model.Issue;
import com.pms.backend.model.WorkflowStatus;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class IssueServiceTest {

    @Mock
    private IssueBoardDao issueBoardDao;

    @Mock
    private WorkflowStatusRepository statusRepository;

    @Mock
    private WorkflowService workflowService;

    @InjectMocks
    private IssueService issueService;

    private Issue issue;
    private WorkflowStatus statusInProgress;
    private WorkflowStatus statusPendingApproval;

    @BeforeEach
    public void setup() {
        issue = new Issue();
        issue.setId(1L);

        statusInProgress = new WorkflowStatus();
        statusInProgress.setId(10L);
        statusInProgress.setName("In Progress");

        statusPendingApproval = new WorkflowStatus();
        statusPendingApproval.setId(11L);
        statusPendingApproval.setName("Pending Approval");
    }

    @Test
    public void testCreateIssue_WithEpicCycle_ThrowsException() {
        Issue parent = new Issue();
        parent.setId(1L); // Cycle back to the same ID
        issue.setEpicLink(parent);

        assertThrows(BusinessException.class, () -> {
            issueService.createIssue(issue);
        });

        verify(issueBoardDao, never()).saveIssue(any(Issue.class));
    }

    @Test
    public void testChangeStatus_InvalidTransition_ThrowsException() {
        issue.setStatus(statusInProgress);
        when(issueBoardDao.findIssueById(1L)).thenReturn(Optional.of(issue));
        when(workflowService.isValidTransition(10L, 11L)).thenReturn(false);

        assertThrows(IllegalArgumentException.class, () -> {
            issueService.changeStatus(1L, 11L, null);
        });
    }

    @Test
    public void testChangeStatus_RejectWithoutReason_ThrowsException() {
        issue.setStatus(statusPendingApproval);
        when(issueBoardDao.findIssueById(1L)).thenReturn(Optional.of(issue));
        when(workflowService.isValidTransition(11L, 10L)).thenReturn(true);
        when(statusRepository.findById(10L)).thenReturn(Optional.of(statusInProgress));

        assertThrows(ValidationException.class, () -> {
            issueService.changeStatus(1L, 10L, "");
        });
    }
}
