package com.pms.backend.service;

import com.pms.backend.service.impl.*;
import com.pms.backend.service.interfaces.*;

import com.pms.backend.dao.*;
import com.pms.backend.dto.SaveWorkflowRequest;
import com.pms.backend.dto.WorkflowStatusDto;
import com.pms.backend.enu.ErrorCode;
import com.pms.backend.enu.StatusCategory;
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

import java.util.List;
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
}
