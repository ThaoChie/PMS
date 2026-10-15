package com.pms.backend.service;

import com.pms.backend.config.AppProperties;
import com.pms.backend.dao.*;
import com.pms.backend.dto.CreateIssueRequest;
import com.pms.backend.dto.UpdateIssueRequest;
import com.pms.backend.enu.ErrorCode;
import com.pms.backend.enu.IssueType;
import com.pms.backend.enu.Priority;
import com.pms.backend.enu.ProjectStatus;
import com.pms.backend.exception.BusinessException;
import com.pms.backend.model.Issue;
import com.pms.backend.model.Project;
import com.pms.backend.model.User;
import com.pms.backend.model.WorkflowStatus;
import com.pms.backend.security.ProjectSecurity;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class IssueServiceTest {

    @Mock private IssueRepository issueRepository;
    @Mock private ProjectRepository projectRepository;
    @Mock private UserRepository userRepository;
    @Mock private ProjectMemberRepository memberRepository;
    @Mock private WorkflowStatusRepository statusRepository;
    @Mock private LabelRepository labelRepository;
    @Mock private IssueLinkRepository linkRepository;
    @Mock private IssueAttachmentRepository attachmentRepository;
    @Mock private IssueStatusHistoryRepository historyRepository;
    @Mock private IssueKeyGenerator keyGenerator;
    @Mock private WorkflowService workflowService;
    @Mock private ProjectSecurity projectSecurity;
    @Mock private NotificationService notificationService;
    @Mock private AuditService auditService;
    @Mock private FileStorageService fileStorageService;
    @Mock private AppProperties appProperties;

    @InjectMocks
    private IssueService issueService;

    private Project project;
    private User user;
    private WorkflowStatus todoStatus;

    @BeforeEach
    public void setup() {
        project = new Project();
        project.setId(1L);
        project.setProjectKey("TEST");
        project.setName("Test Project");
        project.setStatus(ProjectStatus.ACTIVE);

        user = new User();
        user.setId(10L);
        user.setEmail("user@example.com");
        user.setFullName("Test User");

        todoStatus = new WorkflowStatus();
        todoStatus.setId(100L);
        todoStatus.setName("To Do");
        todoStatus.setInitial(true);
    }

    @Test
    public void testCreateIssue_RemainingExceedsOriginal_ThrowsEstimateInvalid() {
        CreateIssueRequest req = new CreateIssueRequest();
        req.setSummary("Invalid estimates issue");
        req.setType(IssueType.TASK);
        req.setOriginalEstimateMin(60);
        req.setRemainingEstimateMin(120);

        when(projectRepository.findById(1L)).thenReturn(Optional.of(project));

        BusinessException ex = assertThrows(BusinessException.class, () -> {
            issueService.createIssue(1L, req, user);
        });

        assertEquals(ErrorCode.ESTIMATE_INVALID, ex.getErrorCode());
        verify(issueRepository, never()).save(any(Issue.class));
    }

    @Test
    public void testCreateIssue_SubtaskNesting_ThrowsException() {
        CreateIssueRequest req = new CreateIssueRequest();
        req.setSummary("Subtask of subtask");
        req.setType(IssueType.SUB_TASK);
        req.setParentId(2L);

        Issue parentSubtask = new Issue();
        parentSubtask.setId(2L);
        parentSubtask.setType(IssueType.SUB_TASK);

        when(projectRepository.findById(1L)).thenReturn(Optional.of(project));
        when(issueRepository.findById(2L)).thenReturn(Optional.of(parentSubtask));

        BusinessException ex = assertThrows(BusinessException.class, () -> {
            issueService.createIssue(1L, req, user);
        });

        assertEquals(ErrorCode.SUBTASK_NESTING_NOT_ALLOWED, ex.getErrorCode());
    }

    @Test
    public void testCreateIssue_DueDateInPast_ThrowsException() {
        CreateIssueRequest req = new CreateIssueRequest();
        req.setSummary("Past due date");
        req.setType(IssueType.BUG);
        req.setDueDate(LocalDate.now().minusDays(1));

        when(projectRepository.findById(1L)).thenReturn(Optional.of(project));

        assertThrows(BusinessException.class, () -> {
            issueService.createIssue(1L, req, user);
        });
    }

    @Test
    public void testUpdateIssue_VersionMismatch_ThrowsConcurrentModification() {
        Issue existingIssue = new Issue();
        existingIssue.setId(5L);
        existingIssue.setIssueKey("TEST-5");
        existingIssue.setVersion(2);
        existingIssue.setProject(project);

        UpdateIssueRequest req = new UpdateIssueRequest();
        req.setSummary("Concurrent update");
        req.setVersion(1); // Stale version

        when(issueRepository.findByIssueKeyAndDeletedAtIsNull("TEST-5")).thenReturn(Optional.of(existingIssue));

        BusinessException ex = assertThrows(BusinessException.class, () -> {
            issueService.updateIssue("TEST-5", req, user);
        });

        assertEquals(ErrorCode.CONCURRENT_MODIFICATION, ex.getErrorCode());
    }

    @Test
    public void testSetEpic_SelfEpic_ThrowsEpicCycle() {
        Issue issue = new Issue();
        issue.setId(10L);
        issue.setIssueKey("TEST-10");
        issue.setProject(project);

        when(issueRepository.findByIssueKeyAndDeletedAtIsNull("TEST-10")).thenReturn(Optional.of(issue));

        BusinessException ex = assertThrows(BusinessException.class, () -> {
            issueService.setEpic("TEST-10", "TEST-10", user);
        });

        assertEquals(ErrorCode.EPIC_LINK_CYCLE, ex.getErrorCode());
    }
}
