package com.pms.backend.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.pms.backend.dao.AppAdminRepository;
import com.pms.backend.dao.ApprovalRequestRepository;
import com.pms.backend.dao.ApprovalStepRepository;
import com.pms.backend.dao.ProjectMemberRepository;
import com.pms.backend.dao.ProjectRepository;
import com.pms.backend.dao.UserRepository;
import com.pms.backend.dto.ApprovalDecisionRequest;
import com.pms.backend.dto.ApprovalRequestResponse;
import com.pms.backend.dto.CreateApprovalRequestRequest;
import com.pms.backend.enu.ApprovalApplyStatus;
import com.pms.backend.enu.ApprovalApproverRole;
import com.pms.backend.enu.ApprovalRequestStatus;
import com.pms.backend.enu.ApprovalRequestType;
import com.pms.backend.enu.ApprovalStepStatus;
import com.pms.backend.enu.ErrorCode;
import com.pms.backend.enu.ProjectRole;
import com.pms.backend.enu.ProjectStatus;
import com.pms.backend.exception.BusinessException;
import com.pms.backend.hibernateDao.IApprovalRequestHibernateDao;
import com.pms.backend.mapper.ApprovalRequestMapper;
import com.pms.backend.model.ApprovalRequest;
import com.pms.backend.model.ApprovalStep;
import com.pms.backend.model.Project;
import com.pms.backend.model.ProjectMember;
import com.pms.backend.model.User;
import com.pms.backend.security.AuthUserPrincipal;
import com.pms.backend.security.ProjectSecurity;
import com.pms.backend.service.impl.ApprovalRequestServiceImpl;
import com.pms.backend.service.interfaces.IApprovalApplyService;
import com.pms.backend.service.interfaces.INotificationService;
import com.pms.backend.wrapper.ProcessEngineClient;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.quality.Strictness;
import org.mockito.junit.jupiter.MockitoSettings;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
public class ApprovalRequestServiceTest {

    @Mock private ApprovalRequestRepository requestRepository;
    @Mock private ApprovalStepRepository stepRepository;
    @Mock private AppAdminRepository appAdminRepository;
    @Mock private ProjectRepository projectRepository;
    @Mock private ProjectMemberRepository memberRepository;
    @Mock private UserRepository userRepository;
    @Mock private IApprovalRequestHibernateDao approvalHibernateDao;
    @Mock private ApprovalRequestMapper mapper;
    @Mock private ProcessEngineClient processEngineClient;
    @Mock private INotificationService notificationService;
    @Mock private IApprovalApplyService applyService;
    @Mock private ObjectMapper objectMapper;
    @Mock private ProjectSecurity projectSecurity;

    @InjectMocks
    private ApprovalRequestServiceImpl service;

    private User requester;
    private User pm2;
    private User admin;
    private Project project;
    private AuthUserPrincipal requesterPrincipal;

    @BeforeEach
    void setUp() {
        requester = new User(); requester.setId(1L); requester.setEmail("pm@test.com"); requester.setFullName("PM User");
        pm2 = new User(); pm2.setId(2L); pm2.setEmail("pm2@test.com"); pm2.setFullName("PM2 User");
        admin = new User(); admin.setId(3L); admin.setEmail("admin@test.com"); admin.setFullName("Admin User");

        project = new Project(); project.setId(10L); project.setName("Test Project"); project.setStatus(ProjectStatus.ACTIVE);

        requesterPrincipal = mock(AuthUserPrincipal.class);
        when(requesterPrincipal.getId()).thenReturn(1L);
    }

    // ---- Tạo yêu cầu ----

    @Test
    void create_shouldSucceed_whenValidPmRequestWithOtherPmAndAdmin() {
        when(projectSecurity.getCurrentUser()).thenReturn(requesterPrincipal);
        when(userRepository.findById(1L)).thenReturn(Optional.of(requester));
        when(projectRepository.findById(10L)).thenReturn(Optional.of(project));
        when(requestRepository.existsByProjectIdAndTypeAndStatus(10L, ApprovalRequestType.PROJECT_CLOSE, ApprovalRequestStatus.PENDING)).thenReturn(false);

        ProjectMember pm1Member = new ProjectMember(project, requester, ProjectRole.PM);
        ProjectMember pm2Member = new ProjectMember(project, pm2, ProjectRole.PM);
        when(memberRepository.findByProjectId(10L)).thenReturn(List.of(pm1Member, pm2Member));
        when(appAdminRepository.findAllAdminUserIds()).thenReturn(List.of(3L));

        ApprovalRequest saved = buildPendingRequest(1L);
        when(requestRepository.save(any())).thenReturn(saved);
        when(stepRepository.saveAll(any())).thenReturn(List.of());
        when(processEngineClient.startApprovalProcess(anyLong(), anyMap())).thenReturn(Optional.empty());
        when(mapper.toResponse(any(), anyLong())).thenReturn(null);

        assertDoesNotThrow(() -> service.create(10L, buildCreateRequest("PROJECT_CLOSE")));
        verify(requestRepository).save(any(ApprovalRequest.class));
    }

    @Test
    void create_shouldThrow_APPROVAL_001_whenDuplicatePending() {
        when(projectSecurity.getCurrentUser()).thenReturn(requesterPrincipal);
        when(userRepository.findById(1L)).thenReturn(Optional.of(requester));
        when(projectRepository.findById(10L)).thenReturn(Optional.of(project));
        when(requestRepository.existsByProjectIdAndTypeAndStatus(10L, ApprovalRequestType.PROJECT_CLOSE, ApprovalRequestStatus.PENDING)).thenReturn(true);

        BusinessException ex = assertThrows(BusinessException.class,
                () -> service.create(10L, buildCreateRequest("PROJECT_CLOSE")));
        assertEquals(ErrorCode.APPROVAL_001, ex.getErrorCode());
    }

    @Test
    void create_shouldThrow_whenProjectAlreadyClosed() {
        project.setStatus(ProjectStatus.CLOSED);
        when(projectSecurity.getCurrentUser()).thenReturn(requesterPrincipal);
        when(userRepository.findById(1L)).thenReturn(Optional.of(requester));
        when(projectRepository.findById(10L)).thenReturn(Optional.of(project));
        when(requestRepository.existsByProjectIdAndTypeAndStatus(any(), any(), any())).thenReturn(false);

        BusinessException ex = assertThrows(BusinessException.class,
                () -> service.create(10L, buildCreateRequest("PROJECT_CLOSE")));
        assertEquals(ErrorCode.PROJECT_CLOSED, ex.getErrorCode());
    }

    @Test
    void create_shouldThrow_whenNoValidApproversAtAll() {
        when(projectSecurity.getCurrentUser()).thenReturn(requesterPrincipal);
        when(userRepository.findById(1L)).thenReturn(Optional.of(requester));
        when(projectRepository.findById(10L)).thenReturn(Optional.of(project));
        when(requestRepository.existsByProjectIdAndTypeAndStatus(any(), any(), any())).thenReturn(false);
        // Only PM is requester, no other PMs, no admins
        ProjectMember onlyPm = new ProjectMember(project, requester, ProjectRole.PM);
        when(memberRepository.findByProjectId(10L)).thenReturn(List.of(onlyPm));
        when(appAdminRepository.findAllAdminUserIds()).thenReturn(List.of());

        BusinessException ex = assertThrows(BusinessException.class,
                () -> service.create(10L, buildCreateRequest("PROJECT_CLOSE")));
        assertEquals(ErrorCode.VALIDATION_ERROR, ex.getErrorCode());
    }

    @Test
    void create_shouldSetLevel2Skipped_whenAppAdminsEmptyButOtherPmExists() {
        when(projectSecurity.getCurrentUser()).thenReturn(requesterPrincipal);
        when(userRepository.findById(1L)).thenReturn(Optional.of(requester));
        when(projectRepository.findById(10L)).thenReturn(Optional.of(project));
        when(requestRepository.existsByProjectIdAndTypeAndStatus(any(), any(), any())).thenReturn(false);

        // Project has another PM (pm2), but app_admins is empty
        ProjectMember pm1Member = new ProjectMember(project, requester, ProjectRole.PM);
        ProjectMember pm2Member = new ProjectMember(project, pm2, ProjectRole.PM);
        when(memberRepository.findByProjectId(10L)).thenReturn(List.of(pm1Member, pm2Member));
        when(appAdminRepository.findAllAdminUserIds()).thenReturn(List.of());

        ApprovalRequest saved = buildPendingRequest(1L);
        when(requestRepository.save(any())).thenReturn(saved);
        when(stepRepository.saveAll(any())).thenAnswer(invocation -> {
            List<ApprovalStep> steps = invocation.getArgument(0);
            assertEquals(2, steps.size());
            assertEquals(ApprovalStepStatus.PENDING, steps.get(0).getStatus()); // Level 1 PM
            assertEquals(ApprovalStepStatus.SKIPPED, steps.get(1).getStatus()); // Level 2 Admin SKIPPED
            return steps;
        });
        when(requestRepository.findByIdWithDetails(1L)).thenReturn(Optional.of(saved));
        when(mapper.toResponse(any(), anyLong())).thenReturn(new ApprovalRequestResponse());

        ApprovalRequestResponse response = service.create(10L, buildCreateRequest("PROJECT_CLOSE"));
        assertNotNull(response);
    }

    // ---- Tự duyệt ----

    @Test
    void approve_shouldThrow_APPROVAL_003_whenSelfApprove() {
        when(projectSecurity.getCurrentUser()).thenReturn(requesterPrincipal);
        when(userRepository.findById(1L)).thenReturn(Optional.of(requester));

        ApprovalRequest request = buildPendingRequest(1L);
        request.setRequester(requester);
        ApprovalStep step = buildPendingStep(1, ApprovalApproverRole.PM);
        request.setSteps(new ArrayList<>(List.of(step)));

        when(requestRepository.findByIdWithDetails(1L)).thenReturn(Optional.of(request));

        BusinessException ex = assertThrows(BusinessException.class,
                () -> service.approve(1L, new ApprovalDecisionRequest()));
        assertEquals(ErrorCode.APPROVAL_003, ex.getErrorCode());
    }

    // ---- Reject bắt buộc comment ----

    @Test
    void reject_shouldThrow_APPROVAL_004_whenNoComment() {
        ApprovalDecisionRequest decision = new ApprovalDecisionRequest();
        decision.setComment("");

        BusinessException ex = assertThrows(BusinessException.class,
                () -> service.reject(1L, decision));
        assertEquals(ErrorCode.APPROVAL_004, ex.getErrorCode());
    }

    @Test
    void reject_shouldThrow_APPROVAL_004_whenNullComment() {
        ApprovalDecisionRequest decision = new ApprovalDecisionRequest();

        BusinessException ex = assertThrows(BusinessException.class,
                () -> service.reject(1L, decision));
        assertEquals(ErrorCode.APPROVAL_004, ex.getErrorCode());
    }

    // ---- Trùng yêu cầu (PENDING) ----

    @Test
    void approve_shouldThrow_APPROVAL_002_whenNotPending() {
        when(projectSecurity.getCurrentUser()).thenReturn(requesterPrincipal);
        when(userRepository.findById(1L)).thenReturn(Optional.of(requester));

        ApprovalRequest request = buildPendingRequest(1L);
        request.setStatus(ApprovalRequestStatus.APPROVED);
        request.setRequester(pm2);
        when(requestRepository.findByIdWithDetails(1L)).thenReturn(Optional.of(request));

        BusinessException ex = assertThrows(BusinessException.class,
                () -> service.approve(1L, new ApprovalDecisionRequest()));
        assertEquals(ErrorCode.APPROVAL_002, ex.getErrorCode());
    }

    // ---- Hủy chỉ do người tạo ----

    @Test
    void cancel_shouldThrow_whenNotRequester() {
        when(projectSecurity.getCurrentUser()).thenReturn(requesterPrincipal);
        ApprovalRequest request = buildPendingRequest(99L);
        request.setRequester(pm2);
        when(requestRepository.findByIdWithDetails(99L)).thenReturn(Optional.of(request));

        BusinessException ex = assertThrows(BusinessException.class,
                () -> service.cancel(99L));
        assertEquals(ErrorCode.FORBIDDEN, ex.getErrorCode());
    }

    @Test
    void cancel_shouldSucceed_whenRequester() {
        when(projectSecurity.getCurrentUser()).thenReturn(requesterPrincipal);
        ApprovalRequest request = buildPendingRequest(1L);
        request.setRequester(requester);
        request.setSteps(new ArrayList<>());
        when(requestRepository.findByIdWithDetails(1L)).thenReturn(Optional.of(request));
        when(requestRepository.save(any())).thenReturn(request);
        when(requestRepository.findByIdWithDetails(1L)).thenReturn(Optional.of(request));
        when(mapper.toResponse(any(), anyLong())).thenReturn(null);

        assertDoesNotThrow(() -> service.cancel(1L));
        verify(requestRepository, atLeastOnce()).save(any());
    }

    // ---- Cờ tắt: service luôn tồn tại (NoOp không ném exception) ----

    @Test
    void processEngineClient_noOp_shouldAlwaysReturnEmpty() {
        // Verify NoOp never throws
        com.pms.backend.wrapper.NoOpProcessEngineClient noOp = new com.pms.backend.wrapper.NoOpProcessEngineClient();
        assertTrue(noOp.isHealthy());
        assertTrue(noOp.startApprovalProcess(1L, java.util.Map.of()).isEmpty());
        assertDoesNotThrow(() -> noOp.correlateDecisionMessage(1L, 1, java.util.Map.of()));
        assertDoesNotThrow(() -> noOp.cancelProcess("key", "reason"));
    }

    // ---- Helpers ----

    private CreateApprovalRequestRequest buildCreateRequest(String type) {
        CreateApprovalRequestRequest req = new CreateApprovalRequestRequest();
        req.setType(type);
        req.setReason("Lý do thử nghiệm");
        return req;
    }

    private ApprovalRequest buildPendingRequest(Long requestId) {
        ApprovalRequest req = new ApprovalRequest();
        req.setId(requestId);
        req.setProject(project);
        req.setStatus(ApprovalRequestStatus.PENDING);
        req.setApplyStatus(ApprovalApplyStatus.NOT_APPLIED);
        req.setType(ApprovalRequestType.PROJECT_CLOSE);
        req.setReason("Test");
        return req;
    }

    private ApprovalStep buildPendingStep(int level, ApprovalApproverRole role) {
        ApprovalStep step = new ApprovalStep();
        step.setLevel(level);
        step.setApproverRole(role);
        step.setStatus(ApprovalStepStatus.PENDING);
        return step;
    }
}
