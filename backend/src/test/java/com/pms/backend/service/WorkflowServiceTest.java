package com.pms.backend.service;

import com.pms.backend.service.impl.*;
import com.pms.backend.service.interfaces.*;

import com.pms.backend.dao.*;
import com.pms.backend.dto.SaveWorkflowRequest;
import com.pms.backend.dto.WorkflowStatusDto;
import com.pms.backend.dto.WorkflowTransitionDto;
import com.pms.backend.enu.ErrorCode;
import com.pms.backend.enu.StatusCategory;
import com.pms.backend.enu.TransitionType;
import com.pms.backend.exception.BusinessException;
import com.pms.backend.exception.ValidationException;
import com.pms.backend.model.Issue;
import com.pms.backend.model.Project;
import com.pms.backend.model.User;
import com.pms.backend.model.WorkflowStatus;
import com.pms.backend.model.WorkflowTransition;
import com.pms.backend.security.ProjectSecurity;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class WorkflowServiceTest {

    @Mock private WorkflowStatusRepository statusRepository;
    @Mock private WorkflowTransitionRepository transitionRepository;
    @Mock private IssueRepository issueRepository;
    @Mock private ProjectRepository projectRepository;
    @Mock private ProjectMemberRepository memberRepository;
    @Mock private IssueStatusHistoryRepository historyRepository;
    @Mock private ProjectSecurity projectSecurity;
    @Mock private INotificationService notificationService;
    @Mock private IAuditService auditService;
    @Mock private IMailService mailService;
    @Mock private com.pms.backend.config.AppProperties appProperties;

    @InjectMocks
    private WorkflowServiceImpl workflowService;

    private Project project;
    private User pmUser;
    private User memberUser;

    @BeforeEach
    public void setup() {
        project = new Project();
        project.setId(1L);

        pmUser = new User();
        pmUser.setId(10L);
        pmUser.setFullName("PM User");

        memberUser = new User();
        memberUser.setId(20L);
        memberUser.setFullName("Member User");
    }

    @Test
    public void testUpdateWorkflow_MissingInitialStatus_ThrowsException() {
        SaveWorkflowRequest req = new SaveWorkflowRequest();
        WorkflowStatusDto s1 = new WorkflowStatusDto();
        s1.setName("To Do");
        s1.setCategory(StatusCategory.TODO);
        s1.setIsInitial(false); // No initial

        WorkflowStatusDto s2 = new WorkflowStatusDto();
        s2.setName("Done");
        s2.setCategory(StatusCategory.DONE);

        req.setStatuses(List.of(s1, s2));

        when(projectRepository.findById(1L)).thenReturn(Optional.of(project));

        assertThrows(BusinessException.class, () -> {
            workflowService.updateWorkflow(1L, req);
        });
    }

    @Test
    public void testUpdateWorkflow_MissingDoneCategory_ThrowsException() {
        SaveWorkflowRequest req = new SaveWorkflowRequest();
        WorkflowStatusDto s1 = new WorkflowStatusDto();
        s1.setName("To Do");
        s1.setCategory(StatusCategory.TODO);
        s1.setIsInitial(true);

        WorkflowStatusDto s2 = new WorkflowStatusDto();
        s2.setName("In Progress");
        s2.setCategory(StatusCategory.IN_PROGRESS); // No DONE

        req.setStatuses(List.of(s1, s2));

        when(projectRepository.findById(1L)).thenReturn(Optional.of(project));

        assertThrows(BusinessException.class, () -> {
            workflowService.updateWorkflow(1L, req);
        });
    }

    @Test
    public void testUpdateWorkflow_DuplicateStatusNames_ThrowsConflict() {
        SaveWorkflowRequest req = new SaveWorkflowRequest();
        WorkflowStatusDto s1 = new WorkflowStatusDto();
        s1.setName("To Do");
        s1.setCategory(StatusCategory.TODO);
        s1.setIsInitial(true);

        WorkflowStatusDto s2 = new WorkflowStatusDto();
        s2.setName("to do"); // Duplicate
        s2.setCategory(StatusCategory.DONE);

        req.setStatuses(List.of(s1, s2));

        when(projectRepository.findById(1L)).thenReturn(Optional.of(project));

        assertThrows(BusinessException.class, () -> {
            workflowService.updateWorkflow(1L, req);
        });
    }

    @Test
    public void testUpdateWorkflow_DeleteStatusWithActiveIssues_ThrowsConflict() {
        SaveWorkflowRequest req = new SaveWorkflowRequest();
        WorkflowStatusDto s1 = new WorkflowStatusDto();
        s1.setId(100L);
        s1.setName("To Do");
        s1.setCategory(StatusCategory.TODO);
        s1.setIsInitial(true);

        WorkflowStatusDto s2 = new WorkflowStatusDto();
        s2.setId(101L);
        s2.setName("Done");
        s2.setCategory(StatusCategory.DONE);

        req.setStatuses(List.of(s1, s2)); // Status 102 is omitted (being deleted)

        WorkflowStatus existing102 = new WorkflowStatus();
        existing102.setId(102L);
        existing102.setName("In Progress");

        when(projectRepository.findById(1L)).thenReturn(Optional.of(project));
        when(statusRepository.findByProjectIdOrderByPositionAsc(1L)).thenReturn(List.of(existing102));
        when(issueRepository.countByStatusIdAndDeletedAtIsNull(102L)).thenReturn(3L); // 3 active issues!

        BusinessException ex = assertThrows(BusinessException.class, () -> {
            workflowService.updateWorkflow(1L, req);
        });

        assertEquals(ErrorCode.CONFLICT, ex.getErrorCode());
    }

    @Test
    public void testUpdateWorkflow_ReorderStatuses_UpdatesPositionsCorrectly() {
        SaveWorkflowRequest req = new SaveWorkflowRequest();

        WorkflowStatusDto s1 = new WorkflowStatusDto();
        s1.setId(100L);
        s1.setName("To Do");
        s1.setCategory(StatusCategory.TODO);
        s1.setIsInitial(true);

        // Newly added status moved to index 1
        WorkflowStatusDto sNew = new WorkflowStatusDto();
        sNew.setName("Review");
        sNew.setCategory(StatusCategory.IN_PROGRESS);

        WorkflowStatusDto s2 = new WorkflowStatusDto();
        s2.setId(101L);
        s2.setName("In Progress");
        s2.setCategory(StatusCategory.IN_PROGRESS);

        WorkflowStatusDto s3 = new WorkflowStatusDto();
        s3.setId(102L);
        s3.setName("Done");
        s3.setCategory(StatusCategory.DONE);

        req.setStatuses(List.of(s1, sNew, s2, s3));

        when(projectRepository.findById(1L)).thenReturn(Optional.of(project));
        when(statusRepository.findByProjectIdOrderByPositionAsc(1L)).thenReturn(List.of());

        WorkflowStatus ws1 = new WorkflowStatus();
        ws1.setId(100L);
        ws1.setName("To Do");

        WorkflowStatus ws2 = new WorkflowStatus();
        ws2.setId(101L);
        ws2.setName("In Progress");

        WorkflowStatus ws3 = new WorkflowStatus();
        ws3.setId(102L);
        ws3.setName("Done");

        when(statusRepository.findById(100L)).thenReturn(Optional.of(ws1));
        when(statusRepository.findById(101L)).thenReturn(Optional.of(ws2));
        when(statusRepository.findById(102L)).thenReturn(Optional.of(ws3));

        when(statusRepository.save(any(WorkflowStatus.class))).thenAnswer(invocation -> invocation.getArgument(0));

        var response = workflowService.updateWorkflow(1L, req);

        assertNotNull(response);
        verify(statusRepository).save(argThat(st -> "To Do".equals(st.getName()) && st.getPosition() == 0));
        verify(statusRepository).save(argThat(st -> "Review".equals(st.getName()) && st.getPosition() == 1));
        verify(statusRepository).save(argThat(st -> "In Progress".equals(st.getName()) && st.getPosition() == 2));
        verify(statusRepository).save(argThat(st -> "Done".equals(st.getName()) && st.getPosition() == 3));
    }

    @Test
    public void testApproveIssue_NonPmMember_ThrowsForbidden() {
        Issue issue = new Issue();
        issue.setId(1L);
        issue.setIssueKey("TEST-1");
        issue.setProject(project);

        when(issueRepository.findByIssueKeyAndDeletedAtIsNull("TEST-1")).thenReturn(Optional.of(issue));
        when(projectSecurity.isPmOrAdmin(1L)).thenReturn(false);

        BusinessException ex = assertThrows(BusinessException.class, () -> {
            workflowService.approveIssue("TEST-1", "Approve note", memberUser);
        });

        assertEquals(ErrorCode.FORBIDDEN, ex.getErrorCode());
    }

    @Test
    public void testRejectIssue_BlankReason_ThrowsValidationException() {
        assertThrows(ValidationException.class, () -> {
            workflowService.rejectIssue("TEST-1", "   ", pmUser);
        });
    }

    @Test
    public void testUpdateWorkflow_RequiredFieldsCleared_SavesNull() {
        when(projectRepository.findById(1L)).thenReturn(Optional.of(project));

        WorkflowStatus ws1 = new WorkflowStatus();
        ws1.setId(10L);
        ws1.setName("To Do");
        ws1.setCategory(StatusCategory.TODO);

        WorkflowStatus ws2 = new WorkflowStatus();
        ws2.setId(20L);
        ws2.setName("Done");
        ws2.setCategory(StatusCategory.DONE);

        when(statusRepository.findById(10L)).thenReturn(Optional.of(ws1));
        when(statusRepository.findById(20L)).thenReturn(Optional.of(ws2));
        when(statusRepository.save(any(WorkflowStatus.class))).thenAnswer(invocation -> invocation.getArgument(0));

        SaveWorkflowRequest req = new SaveWorkflowRequest();
        WorkflowStatusDto s1 = new WorkflowStatusDto();
        s1.setId(10L);
        s1.setName("To Do");
        s1.setCategory(StatusCategory.TODO);
        s1.setIsInitial(true);

        WorkflowStatusDto s2 = new WorkflowStatusDto();
        s2.setId(20L);
        s2.setName("Done");
        s2.setCategory(StatusCategory.DONE);

        req.setStatuses(List.of(s1, s2));

        WorkflowTransitionDto tDto = new WorkflowTransitionDto();
        tDto.setFromStatusId(10L);
        tDto.setToStatusId(20L);
        tDto.setRequiresField(""); // Cleared to blank string
        tDto.setRequiredFields(null);

        req.setTransitions(List.of(tDto));

        when(transitionRepository.save(any())).thenAnswer(invocation -> invocation.getArgument(0));

        var response = workflowService.updateWorkflow(1L, req);
        assertNotNull(response);
        verify(transitionRepository).save(argThat(tr -> tr.getRequiredFields() == null));
    }

    @Test
    public void testUpdateWorkflow_RequiredFieldsUpdated_SavesNewValue() {
        when(projectRepository.findById(1L)).thenReturn(Optional.of(project));

        WorkflowStatus ws1 = new WorkflowStatus();
        ws1.setId(10L);
        ws1.setName("To Do");
        ws1.setCategory(StatusCategory.TODO);

        WorkflowStatus ws2 = new WorkflowStatus();
        ws2.setId(20L);
        ws2.setName("Done");
        ws2.setCategory(StatusCategory.DONE);

        when(statusRepository.findById(10L)).thenReturn(Optional.of(ws1));
        when(statusRepository.findById(20L)).thenReturn(Optional.of(ws2));
        when(statusRepository.save(any(WorkflowStatus.class))).thenAnswer(invocation -> invocation.getArgument(0));

        SaveWorkflowRequest req = new SaveWorkflowRequest();
        WorkflowStatusDto s1 = new WorkflowStatusDto();
        s1.setId(10L);
        s1.setName("To Do");
        s1.setCategory(StatusCategory.TODO);
        s1.setIsInitial(true);

        WorkflowStatusDto s2 = new WorkflowStatusDto();
        s2.setId(20L);
        s2.setName("Done");
        s2.setCategory(StatusCategory.DONE);

        req.setStatuses(List.of(s1, s2));

        WorkflowTransitionDto tDto = new WorkflowTransitionDto();
        tDto.setFromStatusId(10L);
        tDto.setToStatusId(20L);
        tDto.setRequiresField("resolution");

        req.setTransitions(List.of(tDto));

        when(transitionRepository.save(any())).thenAnswer(invocation -> invocation.getArgument(0));

        var response = workflowService.updateWorkflow(1L, req);
        assertNotNull(response);
        verify(transitionRepository).save(argThat(tr -> "resolution".equals(tr.getRequiredFields())));
    }

    @Test
    public void testUpdateWorkflow_ToggleApprovalStepOff_SavesNormalType() {
        when(projectRepository.findById(1L)).thenReturn(Optional.of(project));

        WorkflowStatus ws1 = new WorkflowStatus();
        ws1.setId(10L);
        ws1.setName("In Progress");
        ws1.setCategory(StatusCategory.IN_PROGRESS);

        WorkflowStatus ws2 = new WorkflowStatus();
        ws2.setId(20L);
        ws2.setName("Done");
        ws2.setCategory(StatusCategory.DONE);

        when(statusRepository.findById(10L)).thenReturn(Optional.of(ws1));
        when(statusRepository.findById(20L)).thenReturn(Optional.of(ws2));
        when(statusRepository.save(any(WorkflowStatus.class))).thenAnswer(invocation -> invocation.getArgument(0));

        SaveWorkflowRequest req = new SaveWorkflowRequest();
        WorkflowStatusDto s1 = new WorkflowStatusDto();
        s1.setId(10L);
        s1.setName("In Progress");
        s1.setCategory(StatusCategory.IN_PROGRESS);
        s1.setIsInitial(true);

        WorkflowStatusDto s2 = new WorkflowStatusDto();
        s2.setId(20L);
        s2.setName("Done");
        s2.setCategory(StatusCategory.DONE);

        req.setStatuses(List.of(s1, s2));

        // Previously APPROVE, but user toggled to Thường (isApprovalStep = false)
        WorkflowTransitionDto tDto = new WorkflowTransitionDto();
        tDto.setFromStatusId(10L);
        tDto.setToStatusId(20L);
        tDto.setType(TransitionType.APPROVE);
        tDto.setIsApprovalStep(false);

        req.setTransitions(List.of(tDto));

        when(transitionRepository.save(any())).thenAnswer(invocation -> invocation.getArgument(0));

        var response = workflowService.updateWorkflow(1L, req);
        assertNotNull(response);
        verify(transitionRepository).save(argThat(tr -> tr.getType() == TransitionType.NORMAL));
    }

    @Test
    public void testUpdateWorkflow_ToggleApprovalStepOn_SavesApproveType() {
        when(projectRepository.findById(1L)).thenReturn(Optional.of(project));

        WorkflowStatus ws1 = new WorkflowStatus();
        ws1.setId(10L);
        ws1.setName("In Progress");
        ws1.setCategory(StatusCategory.IN_PROGRESS);

        WorkflowStatus ws2 = new WorkflowStatus();
        ws2.setId(20L);
        ws2.setName("Done");
        ws2.setCategory(StatusCategory.DONE);

        when(statusRepository.findById(10L)).thenReturn(Optional.of(ws1));
        when(statusRepository.findById(20L)).thenReturn(Optional.of(ws2));
        when(statusRepository.save(any(WorkflowStatus.class))).thenAnswer(invocation -> invocation.getArgument(0));

        SaveWorkflowRequest req = new SaveWorkflowRequest();
        WorkflowStatusDto s1 = new WorkflowStatusDto();
        s1.setId(10L);
        s1.setName("In Progress");
        s1.setCategory(StatusCategory.IN_PROGRESS);
        s1.setIsInitial(true);

        WorkflowStatusDto s2 = new WorkflowStatusDto();
        s2.setId(20L);
        s2.setName("Done");
        s2.setCategory(StatusCategory.DONE);

        req.setStatuses(List.of(s1, s2));

        WorkflowTransitionDto tDto = new WorkflowTransitionDto();
        tDto.setFromStatusId(10L);
        tDto.setToStatusId(20L);
        tDto.setIsApprovalStep(true);

        req.setTransitions(List.of(tDto));

        when(transitionRepository.save(any())).thenAnswer(invocation -> invocation.getArgument(0));

        var response = workflowService.updateWorkflow(1L, req);
        assertNotNull(response);
        verify(transitionRepository).save(argThat(tr -> tr.getType() == TransitionType.APPROVE));
    }

    @Test
    public void testUpdateWorkflow_MultipleInitialStatuses_NormalizesToSingleInitial() {
        when(projectRepository.findById(1L)).thenReturn(Optional.of(project));

        WorkflowStatus ws1 = new WorkflowStatus();
        ws1.setId(10L);
        ws1.setName("To Do");
        ws1.setCategory(StatusCategory.TODO);
        ws1.setInitial(true);

        WorkflowStatus ws2 = new WorkflowStatus();
        ws2.setId(20L);
        ws2.setName("Backlog");
        ws2.setCategory(StatusCategory.TODO);
        ws2.setInitial(true);

        WorkflowStatus ws3 = new WorkflowStatus();
        ws3.setId(30L);
        ws3.setName("Done");
        ws3.setCategory(StatusCategory.DONE);
        ws3.setInitial(false);

        when(statusRepository.findByProjectIdOrderByPositionAsc(1L)).thenReturn(List.of(ws1, ws2, ws3));
        when(statusRepository.findById(10L)).thenReturn(Optional.of(ws1));
        when(statusRepository.findById(20L)).thenReturn(Optional.of(ws2));
        when(statusRepository.findById(30L)).thenReturn(Optional.of(ws3));
        when(statusRepository.save(any(WorkflowStatus.class))).thenAnswer(invocation -> invocation.getArgument(0));

        SaveWorkflowRequest req = new SaveWorkflowRequest();
        WorkflowStatusDto s1 = new WorkflowStatusDto();
        s1.setId(10L);
        s1.setName("To Do");
        s1.setCategory(StatusCategory.TODO);
        s1.setIsInitial(true);

        WorkflowStatusDto s2 = new WorkflowStatusDto();
        s2.setId(20L);
        s2.setName("Backlog");
        s2.setCategory(StatusCategory.TODO);
        s2.setIsInitial(true); // Duplicate initial flag

        WorkflowStatusDto s3 = new WorkflowStatusDto();
        s3.setId(30L);
        s3.setName("Done");
        s3.setCategory(StatusCategory.DONE);
        s3.setIsInitial(false);

        req.setStatuses(List.of(s1, s2, s3));

        var response = workflowService.updateWorkflow(1L, req);
        assertNotNull(response);
        assertTrue(ws1.isInitial());
        assertFalse(ws2.isInitial());
        assertFalse(ws3.isInitial());
    }

    @Test
    public void testGetWorkflow_DuplicateStatusNamesInDb_ReturnsDeduplicatedList() {
        WorkflowStatus s1 = new WorkflowStatus();
        s1.setId(1L);
        s1.setName("To Do");
        s1.setCategory(StatusCategory.TODO);
        s1.setPosition(0);

        WorkflowStatus s2 = new WorkflowStatus();
        s2.setId(5L);
        s2.setName("To Do"); // Duplicate
        s2.setCategory(StatusCategory.TODO);
        s2.setPosition(0);

        WorkflowStatus s3 = new WorkflowStatus();
        s3.setId(2L);
        s3.setName("Done");
        s3.setCategory(StatusCategory.DONE);
        s3.setPosition(1);

        when(statusRepository.findByProjectIdOrderByPositionAsc(1L)).thenReturn(List.of(s1, s2, s3));
        when(transitionRepository.findByProjectId(1L)).thenReturn(List.of());

        var response = workflowService.getWorkflow(1L);
        assertNotNull(response);
        assertEquals(2, response.getStatuses().size());
        assertEquals("To Do", response.getStatuses().get(0).getName());
        assertEquals("Done", response.getStatuses().get(1).getName());
        assertEquals(0, response.getStatuses().get(0).getPosition());
        assertEquals(1, response.getStatuses().get(1).getPosition());
    }

    @Test
    public void testGetWorkflow_TransitionsWithNullOrDuplicates_AreSanitized() {
        WorkflowStatus s1 = new WorkflowStatus();
        s1.setId(1L);
        s1.setName("To Do");
        s1.setCategory(StatusCategory.TODO);
        s1.setPosition(0);

        WorkflowStatus s2 = new WorkflowStatus();
        s2.setId(2L);
        s2.setName("Done");
        s2.setCategory(StatusCategory.DONE);
        s2.setPosition(1);

        WorkflowTransition t1 = new WorkflowTransition();
        t1.setId(10L);
        t1.setFromStatus(s1);
        t1.setToStatus(s2);
        t1.setType(TransitionType.APPROVE);

        WorkflowTransition t2Duplicate = new WorkflowTransition();
        t2Duplicate.setId(11L);
        t2Duplicate.setFromStatus(s1);
        t2Duplicate.setToStatus(s2);
        t2Duplicate.setType(TransitionType.NORMAL);

        WorkflowTransition tOrphan = new WorkflowTransition();
        tOrphan.setId(12L);
        tOrphan.setFromStatus(null);
        tOrphan.setToStatus(s2);

        when(statusRepository.findByProjectIdOrderByPositionAsc(1L)).thenReturn(List.of(s1, s2));
        when(transitionRepository.findByProjectId(1L)).thenReturn(List.of(t1, t2Duplicate, tOrphan));

        var response = workflowService.getWorkflow(1L);
        assertNotNull(response);
        assertEquals(2, response.getStatuses().size());
        assertEquals(1, response.getTransitions().size());
        assertEquals("To Do", response.getTransitions().get(0).getFrom());
        assertEquals("Done", response.getTransitions().get(0).getTo());
        assertTrue(response.getTransitions().get(0).getIsApprovalStep());
    }

    @Test
    public void testApproveIssue_NoTransitionToDoneFromCurrentStatus_ThrowsInvalidTransition() {
        WorkflowStatus todo = new WorkflowStatus();
        todo.setId(1L);
        todo.setName("To Do");
        todo.setCategory(StatusCategory.TODO);

        WorkflowStatus inProgress = new WorkflowStatus();
        inProgress.setId(2L);
        inProgress.setName("In Progress");
        inProgress.setCategory(StatusCategory.IN_PROGRESS);

        Issue issue = new Issue();
        issue.setId(1L);
        issue.setIssueKey("TEST-1");
        issue.setProject(project);
        issue.setStatus(todo);

        WorkflowTransition toInProgress = new WorkflowTransition();
        toInProgress.setId(10L);
        toInProgress.setFromStatus(todo);
        toInProgress.setToStatus(inProgress);
        toInProgress.setType(TransitionType.NORMAL);

        when(issueRepository.findByIssueKeyAndDeletedAtIsNull("TEST-1")).thenReturn(Optional.of(issue));
        when(projectSecurity.isPmOrAdmin(1L)).thenReturn(true);
        when(transitionRepository.findByFromStatusId(1L)).thenReturn(List.of(toInProgress));

        BusinessException ex = assertThrows(BusinessException.class, () -> {
            workflowService.approveIssue("TEST-1", "Approved via Board", pmUser);
        });

        assertEquals(ErrorCode.INVALID_TRANSITION, ex.getErrorCode());
        verify(issueRepository, never()).save(any(Issue.class));
    }

    @Test
    public void testApproveIssue_WithApproveTransitionToDone_Succeeds() {
        WorkflowStatus pendingApproval = new WorkflowStatus();
        pendingApproval.setId(3L);
        pendingApproval.setName("Pending Approval");
        pendingApproval.setCategory(StatusCategory.IN_PROGRESS);

        WorkflowStatus done = new WorkflowStatus();
        done.setId(4L);
        done.setName("Done");
        done.setCategory(StatusCategory.DONE);

        Issue issue = new Issue();
        issue.setId(1L);
        issue.setIssueKey("TEST-2");
        issue.setProject(project);
        issue.setStatus(pendingApproval);

        WorkflowTransition approveTrans = new WorkflowTransition();
        approveTrans.setId(20L);
        approveTrans.setFromStatus(pendingApproval);
        approveTrans.setToStatus(done);
        approveTrans.setType(TransitionType.APPROVE);

        when(issueRepository.findByIssueKeyAndDeletedAtIsNull("TEST-2")).thenReturn(Optional.of(issue));
        when(projectSecurity.isPmOrAdmin(1L)).thenReturn(true);
        when(transitionRepository.findByFromStatusId(3L)).thenReturn(List.of(approveTrans));
        when(issueRepository.save(any(Issue.class))).thenAnswer(inv -> inv.getArgument(0));

        Issue updated = workflowService.approveIssue("TEST-2", "Approved", pmUser);

        assertEquals(done, updated.getStatus());
        verify(issueRepository).save(issue);
    }

    @Test
    public void testExecuteTransition_Normal_DoesNotSendNotification() {
        WorkflowStatus todo = new WorkflowStatus();
        todo.setId(1L);
        todo.setName("To Do");
        todo.setCategory(StatusCategory.TODO);

        WorkflowStatus inProgress = new WorkflowStatus();
        inProgress.setId(2L);
        inProgress.setName("In Progress");
        inProgress.setCategory(StatusCategory.IN_PROGRESS);

        Issue issue = new Issue();
        issue.setId(1L);
        issue.setIssueKey("TEST-10");
        issue.setProject(project);
        issue.setStatus(todo);

        WorkflowTransition trans = new WorkflowTransition();
        trans.setId(100L);
        trans.setProject(project);
        trans.setFromStatus(todo);
        trans.setToStatus(inProgress);
        trans.setType(TransitionType.NORMAL);

        when(issueRepository.findByIssueKeyAndDeletedAtIsNull("TEST-10")).thenReturn(Optional.of(issue));
        when(transitionRepository.findById(100L)).thenReturn(Optional.of(trans));
        when(issueRepository.save(any(Issue.class))).thenAnswer(inv -> inv.getArgument(0));
        when(transitionRepository.findByFromStatusId(2L)).thenReturn(List.of());

        workflowService.executeTransition("TEST-10", 100L, null, null, memberUser);

        // Verification: NORMAL transition does not send notification
        verify(notificationService, never()).notify(any(), any(), any(), any(), any(), any(), any());
    }

    @Test
    public void testExecuteTransition_Approve_SendsApprovalResultNotification() {
        WorkflowStatus pendingApproval = new WorkflowStatus();
        pendingApproval.setId(3L);
        pendingApproval.setName("Pending Approval");
        pendingApproval.setCategory(StatusCategory.IN_PROGRESS);

        WorkflowStatus done = new WorkflowStatus();
        done.setId(4L);
        done.setName("Done");
        done.setCategory(StatusCategory.DONE);

        Issue issue = new Issue();
        issue.setId(1L);
        issue.setIssueKey("TEST-11");
        issue.setSummary("Fix bug");
        issue.setProject(project);
        issue.setStatus(pendingApproval);
        issue.setAssignee(memberUser);

        WorkflowTransition approveTrans = new WorkflowTransition();
        approveTrans.setId(101L);
        approveTrans.setProject(project);
        approveTrans.setFromStatus(pendingApproval);
        approveTrans.setToStatus(done);
        approveTrans.setType(TransitionType.APPROVE);

        when(issueRepository.findByIssueKeyAndDeletedAtIsNull("TEST-11")).thenReturn(Optional.of(issue));
        when(transitionRepository.findById(101L)).thenReturn(Optional.of(approveTrans));
        when(projectSecurity.isPmOrAdmin(1L)).thenReturn(true);
        when(issueRepository.save(any(Issue.class))).thenAnswer(inv -> inv.getArgument(0));

        workflowService.executeTransition("TEST-11", 101L, null, "Well done", pmUser);

        verify(notificationService).notify(
                eq(com.pms.backend.enu.NotificationType.APPROVAL_RESULT),
                argThat(recipients -> recipients.contains(memberUser)),
                eq("Công việc đã được phê duyệt: TEST-11"),
                contains("Done"),
                any(),
                eq("TEST-11"),
                eq(pmUser)
        );
    }

    @Test
    public void testExecuteTransition_Reject_SendsApprovalResultNotification() {
        WorkflowStatus pendingApproval = new WorkflowStatus();
        pendingApproval.setId(3L);
        pendingApproval.setName("Pending Approval");
        pendingApproval.setCategory(StatusCategory.IN_PROGRESS);

        WorkflowStatus inProgress = new WorkflowStatus();
        inProgress.setId(2L);
        inProgress.setName("In Progress");
        inProgress.setCategory(StatusCategory.IN_PROGRESS);

        Issue issue = new Issue();
        issue.setId(1L);
        issue.setIssueKey("TEST-12");
        issue.setSummary("Fix bug");
        issue.setProject(project);
        issue.setStatus(pendingApproval);
        issue.setAssignee(memberUser);

        WorkflowTransition rejectTrans = new WorkflowTransition();
        rejectTrans.setId(102L);
        rejectTrans.setProject(project);
        rejectTrans.setFromStatus(pendingApproval);
        rejectTrans.setToStatus(inProgress);
        rejectTrans.setType(TransitionType.REJECT);

        when(issueRepository.findByIssueKeyAndDeletedAtIsNull("TEST-12")).thenReturn(Optional.of(issue));
        when(transitionRepository.findById(102L)).thenReturn(Optional.of(rejectTrans));
        when(projectSecurity.isPmOrAdmin(1L)).thenReturn(true);
        when(issueRepository.save(any(Issue.class))).thenAnswer(inv -> inv.getArgument(0));

        workflowService.executeTransition("TEST-12", 102L, null, "Needs more unit tests", pmUser);

        verify(notificationService).notify(
                eq(com.pms.backend.enu.NotificationType.APPROVAL_RESULT),
                argThat(recipients -> recipients.contains(memberUser)),
                eq("Công việc bị từ chối phê duyệt: TEST-12"),
                contains("In Progress"),
                any(),
                eq("TEST-12"),
                eq(pmUser)
        );
    }

    @Test
    public void testExecuteTransition_ToPendingApproval_SendsApprovalRequestedNotification() {
        WorkflowStatus inProgress = new WorkflowStatus();
        inProgress.setId(2L);
        inProgress.setName("In Progress");
        inProgress.setCategory(StatusCategory.IN_PROGRESS);

        WorkflowStatus pendingApproval = new WorkflowStatus();
        pendingApproval.setId(3L);
        pendingApproval.setName("Pending Approval");
        pendingApproval.setCategory(StatusCategory.IN_PROGRESS);

        Issue issue = new Issue();
        issue.setId(1L);
        issue.setIssueKey("TEST-13");
        issue.setSummary("Fix bug");
        issue.setProject(project);
        issue.setStatus(inProgress);

        WorkflowTransition submitTrans = new WorkflowTransition();
        submitTrans.setId(103L);
        submitTrans.setProject(project);
        submitTrans.setFromStatus(inProgress);
        submitTrans.setToStatus(pendingApproval);
        submitTrans.setType(TransitionType.NORMAL);

        com.pms.backend.model.ProjectMember pmMember = new com.pms.backend.model.ProjectMember();
        pmMember.setUser(pmUser);
        pmMember.setRole(com.pms.backend.enu.ProjectRole.PM);

        when(issueRepository.findByIssueKeyAndDeletedAtIsNull("TEST-13")).thenReturn(Optional.of(issue));
        when(transitionRepository.findById(103L)).thenReturn(Optional.of(submitTrans));
        when(issueRepository.save(any(Issue.class))).thenAnswer(inv -> inv.getArgument(0));
        when(memberRepository.findByProjectId(1L)).thenReturn(List.of(pmMember));

        workflowService.executeTransition("TEST-13", 103L, null, null, memberUser);

        verify(notificationService).notify(
                eq(com.pms.backend.enu.NotificationType.APPROVAL_REQUESTED),
                argThat(approvers -> approvers.contains(pmUser)),
                eq("Yêu cầu phê duyệt: TEST-13"),
                contains("Pending Approval"),
                any(),
                eq("TEST-13"),
                eq(memberUser)
        );
    }

    @Test
    public void testExecuteTransition_WithSendEmailTrue_SendsFeedbackEmailToAssignee() {
        WorkflowStatus pendingApproval = new WorkflowStatus();
        pendingApproval.setId(3L);
        pendingApproval.setName("Pending Approval");
        pendingApproval.setCategory(StatusCategory.IN_PROGRESS);

        WorkflowStatus done = new WorkflowStatus();
        done.setId(4L);
        done.setName("Done");
        done.setCategory(StatusCategory.DONE);

        memberUser.setEmail("assignee@example.com");

        Issue issue = new Issue();
        issue.setId(1L);
        issue.setIssueKey("TEST-14");
        issue.setSummary("Implement feature X");
        issue.setProject(project);
        issue.setStatus(pendingApproval);
        issue.setAssignee(memberUser);

        WorkflowTransition approveTrans = new WorkflowTransition();
        approveTrans.setId(104L);
        approveTrans.setProject(project);
        approveTrans.setFromStatus(pendingApproval);
        approveTrans.setToStatus(done);
        approveTrans.setType(TransitionType.APPROVE);

        when(issueRepository.findByIssueKeyAndDeletedAtIsNull("TEST-14")).thenReturn(Optional.of(issue));
        when(transitionRepository.findById(104L)).thenReturn(Optional.of(approveTrans));
        when(projectSecurity.isPmOrAdmin(1L)).thenReturn(true);
        when(issueRepository.save(any(Issue.class))).thenAnswer(inv -> inv.getArgument(0));

        workflowService.executeTransition("TEST-14", 104L, Map.of("resolution", "Fixed"), "Looks good!", true, pmUser);

        verify(mailService).sendMailAsync(
                eq("assignee@example.com"),
                eq("Phản hồi của PM về công việc của bạn"),
                eq("notification"),
                argThat(vars -> {
                    String msg = (String) vars.get("message");
                    String footerNote = (String) vars.get("footerNote");
                    String buttonText = (String) vars.get("buttonText");
                    return msg.contains("Done") && msg.contains("Fixed") && msg.contains("Looks good!")
                            && "Xem chi tiết công việc".equals(buttonText)
                            && footerNote != null
                            && footerNote.contains("đăng nhập hệ thống EPMS")
                            && !footerNote.contains("công việc được chia sẻ");
                })
        );
    }

    @Test
    public void testExecuteTransition_WithSendEmailFalse_DoesNotSendEmail() {
        WorkflowStatus pendingApproval = new WorkflowStatus();
        pendingApproval.setId(3L);
        pendingApproval.setName("Pending Approval");
        pendingApproval.setCategory(StatusCategory.IN_PROGRESS);

        WorkflowStatus done = new WorkflowStatus();
        done.setId(4L);
        done.setName("Done");
        done.setCategory(StatusCategory.DONE);

        memberUser.setEmail("assignee@example.com");

        Issue issue = new Issue();
        issue.setId(1L);
        issue.setIssueKey("TEST-15");
        issue.setSummary("Implement feature Y");
        issue.setProject(project);
        issue.setStatus(pendingApproval);
        issue.setAssignee(memberUser);

        WorkflowTransition approveTrans = new WorkflowTransition();
        approveTrans.setId(105L);
        approveTrans.setProject(project);
        approveTrans.setFromStatus(pendingApproval);
        approveTrans.setToStatus(done);
        approveTrans.setType(TransitionType.APPROVE);

        when(issueRepository.findByIssueKeyAndDeletedAtIsNull("TEST-15")).thenReturn(Optional.of(issue));
        when(transitionRepository.findById(105L)).thenReturn(Optional.of(approveTrans));
        when(projectSecurity.isPmOrAdmin(1L)).thenReturn(true);
        when(issueRepository.save(any(Issue.class))).thenAnswer(inv -> inv.getArgument(0));

        workflowService.executeTransition("TEST-15", 105L, null, "Approved silently", false, pmUser);

        verify(mailService, never()).sendMailAsync(any(), any(), any(), any());
    }

    @Test
    public void testExecuteTransition_NormalTransitionAsMemberWithSendEmailTrue_DoesNotSendFeedbackEmail() {
        WorkflowStatus todo = new WorkflowStatus();
        todo.setId(1L);
        todo.setName("To Do");
        todo.setCategory(StatusCategory.TODO);

        WorkflowStatus inProgress = new WorkflowStatus();
        inProgress.setId(2L);
        inProgress.setName("In Progress");
        inProgress.setCategory(StatusCategory.IN_PROGRESS);

        User assignee = new User();
        assignee.setId(300L);
        assignee.setEmail("other-assignee@example.com");
        assignee.setFullName("Assignee User");

        Issue issue = new Issue();
        issue.setId(1L);
        issue.setIssueKey("TEST-16");
        issue.setSummary("Start working");
        issue.setProject(project);
        issue.setStatus(todo);
        issue.setAssignee(assignee);

        WorkflowTransition normalTrans = new WorkflowTransition();
        normalTrans.setId(106L);
        normalTrans.setProject(project);
        normalTrans.setFromStatus(todo);
        normalTrans.setToStatus(inProgress);
        normalTrans.setType(TransitionType.NORMAL);

        when(issueRepository.findByIssueKeyAndDeletedAtIsNull("TEST-16")).thenReturn(Optional.of(issue));
        when(transitionRepository.findById(106L)).thenReturn(Optional.of(normalTrans));
        when(issueRepository.save(any(Issue.class))).thenAnswer(inv -> inv.getArgument(0));
        when(transitionRepository.findByFromStatusId(2L)).thenReturn(List.of());

        workflowService.executeTransition("TEST-16", 106L, null, "Starting task", true, memberUser);

        verify(mailService, never()).sendMailAsync(any(), any(), any(), any());
    }

    @Test
    public void testExecuteTransition_NormalTransitionAsPmWithSendEmailTrue_DoesNotSendFeedbackEmail() {
        WorkflowStatus todo = new WorkflowStatus();
        todo.setId(1L);
        todo.setName("To Do");
        todo.setCategory(StatusCategory.TODO);

        WorkflowStatus inProgress = new WorkflowStatus();
        inProgress.setId(2L);
        inProgress.setName("In Progress");
        inProgress.setCategory(StatusCategory.IN_PROGRESS);

        memberUser.setEmail("assignee@example.com");

        Issue issue = new Issue();
        issue.setId(1L);
        issue.setIssueKey("TEST-17");
        issue.setSummary("Start working by PM");
        issue.setProject(project);
        issue.setStatus(todo);
        issue.setAssignee(memberUser);

        WorkflowTransition normalTrans = new WorkflowTransition();
        normalTrans.setId(107L);
        normalTrans.setProject(project);
        normalTrans.setFromStatus(todo);
        normalTrans.setToStatus(inProgress);
        normalTrans.setType(TransitionType.NORMAL);

        when(issueRepository.findByIssueKeyAndDeletedAtIsNull("TEST-17")).thenReturn(Optional.of(issue));
        when(transitionRepository.findById(107L)).thenReturn(Optional.of(normalTrans));
        when(issueRepository.save(any(Issue.class))).thenAnswer(inv -> inv.getArgument(0));
        when(transitionRepository.findByFromStatusId(2L)).thenReturn(List.of());

        workflowService.executeTransition("TEST-17", 107L, null, "PM moving to In Progress", true, pmUser);

        verify(mailService, never()).sendMailAsync(any(), any(), any(), any());
    }

    @Test
    public void testExecuteTransition_RejectTransitionAsPmWithSendEmailTrue_SendsFeedbackEmailToAssignee() {
        WorkflowStatus pendingApproval = new WorkflowStatus();
        pendingApproval.setId(3L);
        pendingApproval.setName("Pending Approval");
        pendingApproval.setCategory(StatusCategory.IN_PROGRESS);

        WorkflowStatus rejected = new WorkflowStatus();
        rejected.setId(5L);
        rejected.setName("Rejected");
        rejected.setCategory(StatusCategory.IN_PROGRESS);

        memberUser.setEmail("assignee@example.com");

        Issue issue = new Issue();
        issue.setId(1L);
        issue.setIssueKey("TEST-18");
        issue.setSummary("Feature needs fixes");
        issue.setProject(project);
        issue.setStatus(pendingApproval);
        issue.setAssignee(memberUser);

        WorkflowTransition rejectTrans = new WorkflowTransition();
        rejectTrans.setId(108L);
        rejectTrans.setProject(project);
        rejectTrans.setFromStatus(pendingApproval);
        rejectTrans.setToStatus(rejected);
        rejectTrans.setType(TransitionType.REJECT);

        when(issueRepository.findByIssueKeyAndDeletedAtIsNull("TEST-18")).thenReturn(Optional.of(issue));
        when(transitionRepository.findById(108L)).thenReturn(Optional.of(rejectTrans));
        when(projectSecurity.isPmOrAdmin(1L)).thenReturn(true);
        when(issueRepository.save(any(Issue.class))).thenAnswer(inv -> inv.getArgument(0));

        workflowService.executeTransition("TEST-18", 108L, Map.of("resolution", "Won't Fix"), "Please revise", true, pmUser);

        verify(mailService).sendMailAsync(
                eq("assignee@example.com"),
                eq("Phản hồi của PM về công việc của bạn"),
                eq("notification"),
                argThat(vars -> {
                    String msg = (String) vars.get("message");
                    return msg.contains("Rejected") && msg.contains("Won't Fix") && msg.contains("Please revise");
                })
        );
    }

    @Test
    public void testExecuteTransition_MissingCustomRequiredField_ThrowsRequiredFieldMissingException() {
        WorkflowStatus inProgress = new WorkflowStatus();
        inProgress.setId(2L);
        inProgress.setName("In Progress");

        WorkflowStatus pendingApproval = new WorkflowStatus();
        pendingApproval.setId(3L);
        pendingApproval.setName("Pending Approval");

        Issue issue = new Issue();
        issue.setId(1L);
        issue.setIssueKey("TEST-16");
        issue.setProject(project);
        issue.setStatus(inProgress);

        WorkflowTransition trans = new WorkflowTransition();
        trans.setId(106L);
        trans.setProject(project);
        trans.setFromStatus(inProgress);
        trans.setToStatus(pendingApproval);
        trans.setType(TransitionType.NORMAL);
        trans.setRequiredFields("Lý do từ chối");

        when(issueRepository.findByIssueKeyAndDeletedAtIsNull("TEST-16")).thenReturn(Optional.of(issue));
        when(transitionRepository.findById(106L)).thenReturn(Optional.of(trans));

        // When fields is empty map
        BusinessException ex = assertThrows(BusinessException.class, () -> {
            workflowService.executeTransition("TEST-16", 106L, Map.of(), null, false, memberUser);
        });

        assertEquals(ErrorCode.REQUIRED_FIELD_MISSING, ex.getErrorCode());
        assertTrue(ex.getMessage().contains("Lý do từ chối"));
        verify(issueRepository, never()).save(any(Issue.class));
    }

    @Test
    public void testExecuteTransition_WithCustomRequiredField_SavesFieldIntoIssueStatusHistory() {
        WorkflowStatus pendingApproval = new WorkflowStatus();
        pendingApproval.setId(3L);
        pendingApproval.setName("Pending Approval");

        WorkflowStatus todo = new WorkflowStatus();
        todo.setId(1L);
        todo.setName("To Do");

        Issue issue = new Issue();
        issue.setId(1L);
        issue.setIssueKey("TEST-17");
        issue.setProject(project);
        issue.setStatus(pendingApproval);

        WorkflowTransition trans = new WorkflowTransition();
        trans.setId(107L);
        trans.setProject(project);
        trans.setFromStatus(pendingApproval);
        trans.setToStatus(todo);
        trans.setType(TransitionType.REJECT);
        trans.setRequiredFields("Lý do từ chối");

        when(issueRepository.findByIssueKeyAndDeletedAtIsNull("TEST-17")).thenReturn(Optional.of(issue));
        when(transitionRepository.findById(107L)).thenReturn(Optional.of(trans));
        when(projectSecurity.isPmOrAdmin(1L)).thenReturn(true);
        when(issueRepository.save(any(Issue.class))).thenAnswer(inv -> inv.getArgument(0));

        workflowService.executeTransition(
                "TEST-17",
                107L,
                Map.of("Lý do từ chối", "Làm sai yêu cầu phần API"),
                null, // comment empty
                false, // no email
                pmUser
        );

        verify(historyRepository).save(argThat(h ->
                h.getComment() != null && h.getComment().contains("Lý do từ chối: Làm sai yêu cầu phần API")
        ));
    }
}
