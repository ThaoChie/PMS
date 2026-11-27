package com.pms.backend.service;

import com.pms.backend.service.impl.*;
import com.pms.backend.service.interfaces.*;

import com.pms.backend.config.AppProperties;
import com.pms.backend.dao.*;
import com.pms.backend.dto.CreateIssueRequest;
import com.pms.backend.dto.UpdateIssueRequest;
import com.pms.backend.enu.ErrorCode;
import com.pms.backend.enu.IssueType;
import com.pms.backend.enu.Priority;
import com.pms.backend.enu.ProjectStatus;
import com.pms.backend.exception.BusinessException;
import com.pms.backend.exception.ValidationException;
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
import java.util.List;
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
    @Mock private IIssueKeyGenerator keyGenerator;
    @Mock private IWorkflowService workflowService;
    @Mock private ProjectSecurity projectSecurity;
    @Mock private INotificationService notificationService;
    @Mock private IAuditService auditService;
    @Mock private IFileStorageService fileStorageService;
    @Mock private AppProperties appProperties;

    @InjectMocks
    private IssueServiceImpl issueService;

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

    @Test
    public void testCreateSubtask_ParentIsSubtask_ThrowsException() {
        Issue parent = new Issue();
        parent.setId(20L);
        parent.setIssueKey("TEST-20");
        parent.setType(IssueType.SUB_TASK);
        parent.setProject(project);

        when(issueRepository.findByIssueKeyAndDeletedAtIsNull("TEST-20")).thenReturn(Optional.of(parent));

        BusinessException ex = assertThrows(BusinessException.class, () ->
                issueService.createSubtask("TEST-20", "Child subtask", null, user));

        assertEquals(ErrorCode.SUBTASK_NESTING_NOT_ALLOWED, ex.getErrorCode());
    }

    @Test
    public void testConvertToSubtask_EpicWithChildren_ThrowsException() {
        Issue epic = new Issue();
        epic.setId(30L);
        epic.setIssueKey("TEST-30");
        epic.setType(IssueType.EPIC);
        epic.setProject(project);

        Issue parent = new Issue();
        parent.setId(31L);
        parent.setIssueKey("TEST-31");
        parent.setType(IssueType.TASK);
        parent.setProject(project);

        when(issueRepository.findByIssueKeyAndDeletedAtIsNull("TEST-30")).thenReturn(Optional.of(epic));
        when(issueRepository.findByIssueKeyAndDeletedAtIsNull("TEST-31")).thenReturn(Optional.of(parent));
        when(issueRepository.findByEpicIdAndDeletedAtIsNull(30L)).thenReturn(List.of(new Issue()));

        BusinessException ex = assertThrows(BusinessException.class, () ->
                issueService.convertToSubtask("TEST-30", "TEST-31", user));

        assertEquals(ErrorCode.UNPROCESSABLE_ENTITY, ex.getErrorCode());
    }

    @Test
    public void testConvertToSubtask_Success_UnlinksEpicAndLinks() {
        Issue epic = new Issue();
        epic.setId(40L);
        epic.setIssueKey("TEST-40");

        Issue story = new Issue();
        story.setId(41L);
        story.setIssueKey("TEST-41");
        story.setType(IssueType.TASK);
        story.setProject(project);
        story.setEpic(epic);

        Issue parent = new Issue();
        parent.setId(42L);
        parent.setIssueKey("TEST-42");
        parent.setType(IssueType.TASK);
        parent.setProject(project);

        when(issueRepository.findByIssueKeyAndDeletedAtIsNull("TEST-41")).thenReturn(Optional.of(story));
        when(issueRepository.findByIssueKeyAndDeletedAtIsNull("TEST-42")).thenReturn(Optional.of(parent));

        issueService.convertToSubtask("TEST-41", "TEST-42", user);

        assertEquals(IssueType.SUB_TASK, story.getType());
        assertEquals(parent, story.getParent());
        assertNull(story.getEpic());

        verify(linkRepository, times(1)).deleteBySourceIssueIdOrTargetIssueId(41L, 42L);
        verify(linkRepository, times(1)).deleteBySourceIssueIdOrTargetIssueId(42L, 41L);
        verify(issueRepository, times(1)).save(story);
    }

    @Test
    public void testCreateIssue_UsesFirstInitialStatusAndSavesCustomFields_Success() {
        ICustomFieldService mockCustomFieldService = mock(ICustomFieldService.class);
        org.springframework.test.util.ReflectionTestUtils.setField(issueService, "customFieldService", mockCustomFieldService);

        CreateIssueRequest req = new CreateIssueRequest();
        req.setSummary("Bug with custom fields");
        req.setType(IssueType.BUG);
        req.setPriority(Priority.MEDIUM);
        req.setDueDate(LocalDate.now().plusDays(1));
        req.setCustomFields(java.util.Map.of("env", "Prod"));

        when(projectRepository.findById(1L)).thenReturn(Optional.of(project));
        when(statusRepository.findFirstByProjectIdAndIsInitialTrueOrderByPositionAscIdAsc(1L))
                .thenReturn(Optional.of(todoStatus));
        when(keyGenerator.generateNextKey(1L, "TEST")).thenReturn("TEST-101");
        when(issueRepository.save(any(Issue.class))).thenAnswer(inv -> {
            Issue i = inv.getArgument(0);
            i.setId(99L);
            return i;
        });

        var res = issueService.createIssue(1L, req, user);

        assertNotNull(res);
        assertEquals("TEST-101", res.getIssueKey());
        assertEquals("To Do", res.getStatus());
        verify(statusRepository).findFirstByProjectIdAndIsInitialTrueOrderByPositionAscIdAsc(1L);
        verify(statusRepository, never()).findByProjectIdAndIsInitialTrue(anyLong());
        verify(mockCustomFieldService).validateAndSaveIssueCustomFields(any(Issue.class), eq(req.getCustomFields()));
        verify(mockCustomFieldService).getIssueCustomFields(99L, 1L);
    }

    @Test
    public void testCreateSubtask_MissingAssigneeOrDueDate_ThrowsValidationException() {
        Issue parent = new Issue();
        parent.setId(21L);
        parent.setIssueKey("TEST-21");
        parent.setType(IssueType.TASK);
        parent.setProject(project);

        when(issueRepository.findByIssueKeyAndDeletedAtIsNull("TEST-21")).thenReturn(Optional.of(parent));

        assertThrows(ValidationException.class, () ->
                issueService.createSubtask("TEST-21", "Child subtask", null, LocalDate.now().plusDays(1), user));

        assertThrows(ValidationException.class, () ->
                issueService.createSubtask("TEST-21", "Child subtask", 10L, null, user));

        verify(issueRepository, never()).save(any(Issue.class));
    }

    @Test
    public void testCreateSubtask_WithRequiredFields_PersistsAssigneeAndDueDate() {
        Issue parent = new Issue();
        parent.setId(22L);
        parent.setIssueKey("TEST-22");
        parent.setType(IssueType.TASK);
        parent.setProject(project);

        LocalDate dueDate = LocalDate.now().plusDays(3);

        when(issueRepository.findByIssueKeyAndDeletedAtIsNull("TEST-22")).thenReturn(Optional.of(parent));
        when(projectRepository.findById(1L)).thenReturn(Optional.of(project));
        when(userRepository.findById(10L)).thenReturn(Optional.of(user));
        when(memberRepository.existsByProjectIdAndUserId(1L, 10L)).thenReturn(true);
        when(statusRepository.findFirstByProjectIdAndIsInitialTrueOrderByPositionAscIdAsc(1L))
                .thenReturn(Optional.of(todoStatus));
        when(issueRepository.findById(22L)).thenReturn(Optional.of(parent));
        when(keyGenerator.generateNextKey(1L, "TEST")).thenReturn("TEST-23");
        when(issueRepository.save(any(Issue.class))).thenAnswer(inv -> {
            Issue i = inv.getArgument(0);
            i.setId(23L);
            return i;
        });

        var res = issueService.createSubtask("TEST-22", "Child subtask", 10L, dueDate, user);

        assertNotNull(res);
        assertEquals("TEST-23", res.getKey());
        assertEquals(dueDate, res.getDueDate());
        assertNotNull(res.getAssignee());
        assertEquals(10L, res.getAssignee().getId());
    }

    @Test
    public void testConvertToIssue_SubtaskToValidStandaloneTypes_Success() {
        Issue subtask = new Issue();
        subtask.setId(50L);
        subtask.setIssueKey("TEST-50");
        subtask.setType(IssueType.SUB_TASK);
        subtask.setProject(project);
        subtask.setParent(new Issue());

        when(issueRepository.findByIssueKeyAndDeletedAtIsNull("TEST-50")).thenReturn(Optional.of(subtask));

        issueService.convertToIssue("TEST-50", IssueType.STORY, user);

        assertEquals(IssueType.STORY, subtask.getType());
        assertNull(subtask.getParent());
        verify(issueRepository, times(1)).save(subtask);
    }
}
