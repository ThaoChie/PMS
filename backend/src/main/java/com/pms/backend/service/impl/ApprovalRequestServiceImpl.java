package com.pms.backend.service.impl;

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
import com.pms.backend.dto.SaveWorkflowRequest;
import com.pms.backend.enu.ApprovalApproverRole;
import com.pms.backend.enu.ApprovalApplyStatus;
import com.pms.backend.enu.ApprovalRequestStatus;
import com.pms.backend.enu.ApprovalRequestType;
import com.pms.backend.enu.ApprovalStepStatus;
import com.pms.backend.enu.ErrorCode;
import com.pms.backend.enu.NotificationType;
import com.pms.backend.enu.ProjectRole;
import com.pms.backend.enu.ProjectStatus;
import com.pms.backend.exception.BusinessException;
import com.pms.backend.exception.ResourceNotFoundException;
import com.pms.backend.hibernateDao.IApprovalRequestHibernateDao;
import com.pms.backend.mapper.ApprovalRequestMapper;
import com.pms.backend.model.ApprovalRequest;
import com.pms.backend.model.ApprovalStep;
import com.pms.backend.model.Project;
import com.pms.backend.model.ProjectMember;
import com.pms.backend.model.User;
import com.pms.backend.security.AuthUserPrincipal;
import com.pms.backend.security.ProjectSecurity;
import com.pms.backend.service.interfaces.IApprovalApplyService;
import com.pms.backend.service.interfaces.IApprovalRequestService;
import com.pms.backend.service.interfaces.INotificationService;
import com.pms.backend.wrapper.PageWrapper;
import com.pms.backend.wrapper.ProcessEngineClient;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.pms.backend.config.ApprovalProperties;
import com.pms.backend.model.AppAdmin;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class ApprovalRequestServiceImpl implements IApprovalRequestService {

    private static final Logger log = LoggerFactory.getLogger(ApprovalRequestServiceImpl.class);

    private final ApprovalRequestRepository requestRepository;
    private final ApprovalStepRepository stepRepository;
    private final AppAdminRepository appAdminRepository;
    private final ProjectRepository projectRepository;
    private final ProjectMemberRepository memberRepository;
    private final UserRepository userRepository;
    private final IApprovalRequestHibernateDao approvalHibernateDao;
    private final ApprovalRequestMapper mapper;
    private final ProcessEngineClient processEngineClient;
    private final INotificationService notificationService;
    private final IApprovalApplyService applyService;
    private final ObjectMapper objectMapper;
    private final ProjectSecurity projectSecurity;
    private final ApprovalProperties approvalProperties;

    public ApprovalRequestServiceImpl(ApprovalRequestRepository requestRepository,
                                       ApprovalStepRepository stepRepository,
                                       AppAdminRepository appAdminRepository,
                                       ProjectRepository projectRepository,
                                       ProjectMemberRepository memberRepository,
                                       UserRepository userRepository,
                                       IApprovalRequestHibernateDao approvalHibernateDao,
                                       ApprovalRequestMapper mapper,
                                       ProcessEngineClient processEngineClient,
                                       INotificationService notificationService,
                                       IApprovalApplyService applyService,
                                       ObjectMapper objectMapper,
                                       ProjectSecurity projectSecurity) {
        this(requestRepository, stepRepository, appAdminRepository, projectRepository,
                memberRepository, userRepository, approvalHibernateDao, mapper,
                processEngineClient, notificationService, applyService, objectMapper,
                projectSecurity, null);
    }

    @Autowired
    public ApprovalRequestServiceImpl(ApprovalRequestRepository requestRepository,
                                       ApprovalStepRepository stepRepository,
                                       AppAdminRepository appAdminRepository,
                                       ProjectRepository projectRepository,
                                       ProjectMemberRepository memberRepository,
                                       UserRepository userRepository,
                                       IApprovalRequestHibernateDao approvalHibernateDao,
                                       ApprovalRequestMapper mapper,
                                       ProcessEngineClient processEngineClient,
                                       INotificationService notificationService,
                                       IApprovalApplyService applyService,
                                       ObjectMapper objectMapper,
                                       ProjectSecurity projectSecurity,
                                       @Autowired(required = false) ApprovalProperties approvalProperties) {
        this.requestRepository = requestRepository;
        this.stepRepository = stepRepository;
        this.appAdminRepository = appAdminRepository;
        this.projectRepository = projectRepository;
        this.memberRepository = memberRepository;
        this.userRepository = userRepository;
        this.approvalHibernateDao = approvalHibernateDao;
        this.mapper = mapper;
        this.processEngineClient = processEngineClient;
        this.notificationService = notificationService;
        this.applyService = applyService;
        this.objectMapper = objectMapper;
        this.projectSecurity = projectSecurity;
        this.approvalProperties = approvalProperties;
    }

    @Override
    @Transactional
    public ApprovalRequestResponse create(Long projectId, CreateApprovalRequestRequest req) {
        AuthUserPrincipal principal = projectSecurity.getCurrentUser();
        User requester = userRepository.findById(principal.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Người dùng không tồn tại"));

        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new ResourceNotFoundException("Dự án không tồn tại: " + projectId));

        ApprovalRequestType type;
        try {
            type = ApprovalRequestType.valueOf(req.getType().toUpperCase());
        } catch (Exception e) {
            throw new BusinessException(ErrorCode.VALIDATION_ERROR, "Loại yêu cầu không hợp lệ: " + req.getType());
        }

        if (type == ApprovalRequestType.PROJECT_CLOSE && project.getStatus() == ProjectStatus.CLOSED) {
            throw new BusinessException(ErrorCode.PROJECT_CLOSED, "Dự án đã ở trạng thái CLOSED");
        }

        if (requestRepository.existsByProjectIdAndTypeAndStatus(projectId, type, ApprovalRequestStatus.PENDING)) {
            throw new BusinessException(ErrorCode.APPROVAL_001,
                    "Đã có yêu cầu duyệt cùng loại đang chờ xử lý cho dự án này");
        }

        String payloadJson = null;
        if (type == ApprovalRequestType.WORKFLOW_CONFIG_CHANGE) {
            payloadJson = validateAndSerializePayload(req.getPayload(), project);
        }

        List<ApprovalStep> steps = buildSteps(projectId, requester.getId());
        boolean hasAnyActive = steps.stream()
                .anyMatch(s -> s.getStatus() != ApprovalStepStatus.SKIPPED);
        if (!hasAnyActive) {
            throw new BusinessException(ErrorCode.VALIDATION_ERROR,
                    "Không tìm thấy người duyệt hợp lệ nào. Dự án cần có ít nhất 1 PM khác hoặc 1 Admin.");
        }

        ApprovalRequest request = new ApprovalRequest();
        request.setProject(project);
        request.setType(type);
        request.setRequester(requester);
        request.setReason(req.getReason());
        request.setPayloadJson(payloadJson);
        request.setStatus(ApprovalRequestStatus.PENDING);
        request.setApplyStatus(ApprovalApplyStatus.NOT_APPLIED);

        ApprovalRequest saved = requestRepository.save(request);

        for (ApprovalStep step : steps) {
            step.setRequest(saved);
        }
        stepRepository.saveAll(steps);
        saved.setSteps(steps);

        notifyPendingApprovers(saved, project, requester);

        Map<String, Object> vars = new HashMap<>();
        vars.put("requestId", saved.getId());
        vars.put("projectId", projectId);
        vars.put("type", type.name());
        vars.put("level1Status", steps.get(0).getStatus().name());
        vars.put("level2Status", steps.size() > 1 ? steps.get(1).getStatus().name() : "SKIPPED");
        vars.put("reminderDuration", approvalProperties != null ? "PT" + approvalProperties.getReminderAfterHours() + "H" : "PT24H");
        vars.put("escalateDuration", approvalProperties != null ? "PT" + approvalProperties.getEscalateAfterHours() + "H" : "PT72H");
        vars.put("expireDuration", approvalProperties != null ? "P" + approvalProperties.getExpireAfterDays() + "D" : "P14D");

        if (TransactionSynchronizationManager.isActualTransactionActive()) {
            TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
                @Override
                public void afterCommit() {
                    tryStartProcess(saved.getId(), vars);
                }
            });
        } else {
            tryStartProcess(saved.getId(), vars);
        }

        return mapper.toResponse(saved, principal.getId());
    }

    public void tryStartProcess(Long requestId, Map<String, Object> vars) {
        try {
            processEngineClient.startApprovalProcess(requestId, vars)
                    .ifPresent(key -> updateProcessInstanceKey(requestId, key));
        } catch (Exception e) {
            log.warn("Không thể khởi động quy trình điều phối cho yêu cầu #{}: {}. Yêu cầu vẫn PENDING và sẽ được đối soát kích hoạt lại.", requestId, e.getMessage());
        }
    }

    @Override
    @Transactional
    public void updateProcessInstanceKey(Long requestId, String processInstanceKey) {
        requestRepository.findById(requestId).ifPresent(req -> {
            req.setProcessInstanceKey(processInstanceKey);
            requestRepository.save(req);
        });
    }

    @Override
    @Transactional
    public void sendReminder(Long requestId) {
        ApprovalRequest request = requestRepository.findByIdWithDetails(requestId).orElse(null);
        if (request == null || request.getStatus() != ApprovalRequestStatus.PENDING) {
            return;
        }
        ApprovalStep pendingStep = request.getSteps().stream()
                .filter(s -> s.getStatus() == ApprovalStepStatus.PENDING)
                .findFirst().orElse(null);
        if (pendingStep == null) {
            return;
        }

        pendingStep.setReminderCount(pendingStep.getReminderCount() + 1);
        stepRepository.save(pendingStep);

        List<User> approvers = findApproversForStep(pendingStep, request.getProject().getId());
        if (!approvers.isEmpty()) {
            String title = "Nhắc nhở duyệt: " + request.getType().name();
            String message = "Yêu cầu duyệt #" + request.getId() + " cho dự án " + request.getProject().getName()
                    + " đang chờ bạn phê duyệt (nhắc lần " + pendingStep.getReminderCount() + ").";
            String link = "/projects/" + request.getProject().getId() + "/approval-requests/" + request.getId();
            notificationService.notify(NotificationType.APPROVAL_REQUESTED, approvers, title, message, link, null, request.getRequester());
        }
    }

    @Override
    @Transactional
    public void escalate(Long requestId) {
        ApprovalRequest request = requestRepository.findByIdWithDetails(requestId).orElse(null);
        if (request == null || request.getStatus() != ApprovalRequestStatus.PENDING) {
            return;
        }
        List<User> admins = appAdminRepository.findAll().stream()
                .map(AppAdmin::getUser)
                .filter(u -> u != null && !u.getId().equals(request.getRequester().getId()))
                .collect(Collectors.toList());
        if (!admins.isEmpty()) {
            String title = "ESCALATE: Yêu cầu duyệt #" + request.getId() + " bị treo quá hạn";
            String message = "Yêu cầu duyệt " + request.getType().name() + " của dự án "
                    + request.getProject().getName() + " đã quá hạn xử lý cần can thiệp.";
            String link = "/projects/" + request.getProject().getId() + "/approval-requests/" + request.getId();
            notificationService.notify(NotificationType.APPROVAL_REQUESTED, admins, title, message, link, null, null);
        }
    }

    @Override
    @Transactional
    public void expire(Long requestId) {
        ApprovalRequest request = requestRepository.findByIdWithDetails(requestId).orElse(null);
        if (request == null || request.getStatus() != ApprovalRequestStatus.PENDING) {
            return;
        }
        request.setStatus(ApprovalRequestStatus.EXPIRED);
        request.setCompletedAt(LocalDateTime.now());
        requestRepository.save(request);

        notifyRequester(request, request.getProject(), request.getRequester(),
                "Yêu cầu duyệt #" + request.getId() + " đã hết hạn thời gian chờ xử lý và tự động đóng lại.",
                NotificationType.APPROVAL_RESULT);
    }

    @Override
    @Transactional
    public ApprovalRequestResponse approve(Long requestId, ApprovalDecisionRequest decision) {
        AuthUserPrincipal principal = projectSecurity.getCurrentUser();
        User decider = userRepository.findById(principal.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Người dùng không tồn tại"));

        ApprovalRequest request = loadWithDetails(requestId);
        ensurePending(request);

        ApprovalStep pendingStep = getPendingStep(request);
        validateDecider(pendingStep, decider, request.getRequester(), request.getProject().getId());

        pendingStep.setStatus(ApprovalStepStatus.APPROVED);
        pendingStep.setDecidedBy(decider);
        pendingStep.setDecidedAt(LocalDateTime.now());
        pendingStep.setComment(decision.getComment());
        stepRepository.save(pendingStep);

        ApprovalStep nextStep = findNextWaitingStep(request, pendingStep.getLevel());
        if (nextStep != null) {
            nextStep.setStatus(ApprovalStepStatus.PENDING);
            stepRepository.save(nextStep);
            notifyStepApprovers(request, nextStep, request.getProject(), request.getRequester());
        } else {
            request.setStatus(ApprovalRequestStatus.APPROVED);
            request.setCompletedAt(LocalDateTime.now());
            requestRepository.save(request);
            notifyRequester(request, request.getProject(), request.getRequester(),
                    "Yêu cầu duyệt đã được phê duyệt hoàn toàn", NotificationType.APPROVAL_RESULT);
            applyService.apply(requestId);
        }

        correlateDecision(request, pendingStep.getLevel(), "APPROVED", decision.getComment());
        return mapper.toResponse(loadWithDetails(requestId), principal.getId());
    }

    @Override
    @Transactional
    public ApprovalRequestResponse reject(Long requestId, ApprovalDecisionRequest decision) {
        if (decision.getComment() == null || decision.getComment().isBlank()) {
            throw new BusinessException(ErrorCode.APPROVAL_004, "Từ chối yêu cầu bắt buộc phải có lý do");
        }

        AuthUserPrincipal principal = projectSecurity.getCurrentUser();
        User decider = userRepository.findById(principal.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Người dùng không tồn tại"));

        ApprovalRequest request = loadWithDetails(requestId);
        ensurePending(request);

        ApprovalStep pendingStep = getPendingStep(request);
        validateDecider(pendingStep, decider, request.getRequester(), request.getProject().getId());

        pendingStep.setStatus(ApprovalStepStatus.REJECTED);
        pendingStep.setDecidedBy(decider);
        pendingStep.setDecidedAt(LocalDateTime.now());
        pendingStep.setComment(decision.getComment());
        stepRepository.save(pendingStep);

        request.setStatus(ApprovalRequestStatus.REJECTED);
        request.setCompletedAt(LocalDateTime.now());
        requestRepository.save(request);

        notifyRequester(request, request.getProject(), request.getRequester(),
                "Yêu cầu duyệt đã bị từ chối: " + decision.getComment(), NotificationType.APPROVAL_RESULT);

        correlateDecision(request, pendingStep.getLevel(), "REJECTED", decision.getComment());
        return mapper.toResponse(loadWithDetails(requestId), principal.getId());
    }

    @Override
    @Transactional
    public ApprovalRequestResponse cancel(Long requestId) {
        AuthUserPrincipal principal = projectSecurity.getCurrentUser();
        ApprovalRequest request = loadWithDetails(requestId);
        ensurePending(request);

        if (!request.getRequester().getId().equals(principal.getId())) {
            throw new BusinessException(ErrorCode.FORBIDDEN, "Chỉ người tạo yêu cầu mới có thể hủy");
        }

        request.setStatus(ApprovalRequestStatus.CANCELLED);
        request.setCompletedAt(LocalDateTime.now());
        requestRepository.save(request);

        if (request.getProcessInstanceKey() != null) {
            processEngineClient.cancelProcess(request.getProcessInstanceKey(), "Người dùng hủy");
        }

        return mapper.toResponse(loadWithDetails(requestId), principal.getId());
    }

    @Override
    @Transactional(readOnly = true)
    public ApprovalRequestResponse getById(Long requestId) {
        AuthUserPrincipal principal = projectSecurity.getCurrentUser();
        return mapper.toResponse(loadWithDetails(requestId), principal.getId());
    }

    @Override
    @Transactional(readOnly = true)
    public PageWrapper<ApprovalRequestResponse> findByProject(Long projectId, String status, String type, int page, int size) {
        AuthUserPrincipal principal = projectSecurity.getCurrentUser();
        PageWrapper<ApprovalRequest> raw = approvalHibernateDao.findByProjectId(projectId, status, type, page, size);
        List<ApprovalRequestResponse> content = raw.getContent().stream()
                .map(r -> mapper.toResponse(r, principal.getId()))
                .collect(Collectors.toList());
        return PageWrapper.of(content, raw.getPage(), raw.getSize(), raw.getTotalElements());
    }

    @Override
    @Transactional(readOnly = true)
    public List<ApprovalRequestResponse> findPendingForMe() {
        AuthUserPrincipal principal = projectSecurity.getCurrentUser();
        boolean isAdmin = appAdminRepository.existsByUserId(principal.getId());

        // Find all projects where current user is PM
        List<Long> myPmProjectIds = memberRepository.findAll().stream()
                .filter(m -> m.getUser() != null && m.getUser().getId().equals(principal.getId())
                        && m.getRole() == ProjectRole.PM)
                .map(m -> m.getProject().getId())
                .collect(Collectors.toList());

        List<ApprovalRequest> requests = approvalHibernateDao.findPendingForUser(
                principal.getId(), isAdmin, myPmProjectIds);
        return requests.stream()
                .map(r -> mapper.toResponse(r, principal.getId()))
                .collect(Collectors.toList());
    }

    // ---- private helpers ----

    private List<ApprovalStep> buildSteps(Long projectId, Long requesterId) {
        List<ApprovalStep> steps = new ArrayList<>();

        // Level 1: PM (other PMs in the project)
        List<ProjectMember> pms = memberRepository.findByProjectId(projectId).stream()
                .filter(m -> m.getRole() == ProjectRole.PM && !m.getUser().getId().equals(requesterId))
                .collect(Collectors.toList());
        ApprovalStep step1 = new ApprovalStep();
        step1.setLevel(1);
        step1.setApproverRole(ApprovalApproverRole.PM);
        step1.setStatus(pms.isEmpty() ? ApprovalStepStatus.SKIPPED : ApprovalStepStatus.PENDING);
        steps.add(step1);

        // Level 2: ADMIN (system admins, excluding requester)
        List<Long> adminIds = appAdminRepository.findAllAdminUserIds().stream()
                .filter(id -> !id.equals(requesterId))
                .collect(Collectors.toList());
        ApprovalStep step2 = new ApprovalStep();
        step2.setLevel(2);
        step2.setApproverRole(ApprovalApproverRole.ADMIN);
        if (step1.getStatus() == ApprovalStepStatus.SKIPPED) {
            step2.setStatus(adminIds.isEmpty() ? ApprovalStepStatus.SKIPPED : ApprovalStepStatus.PENDING);
        } else {
            step2.setStatus(adminIds.isEmpty() ? ApprovalStepStatus.SKIPPED : ApprovalStepStatus.WAITING);
        }
        steps.add(step2);

        return steps;
    }

    private String validateAndSerializePayload(Object payload, Project project) {
        if (payload == null) {
            throw new BusinessException(ErrorCode.VALIDATION_ERROR,
                    "WORKFLOW_CONFIG_CHANGE yêu cầu payload hợp lệ");
        }
        try {
            String json = objectMapper.writeValueAsString(payload);
            SaveWorkflowRequest wfReq = objectMapper.readValue(json, SaveWorkflowRequest.class);
            if (wfReq.getStatuses() == null || wfReq.getStatuses().isEmpty()) {
                throw new BusinessException(ErrorCode.VALIDATION_ERROR, "Danh sách statuses không được trống");
            }
            return json;
        } catch (BusinessException e) {
            throw e;
        } catch (Exception e) {
            throw new BusinessException(ErrorCode.VALIDATION_ERROR,
                    "Payload không đúng định dạng cấu hình Workflow: " + e.getMessage());
        }
    }

    private ApprovalRequest loadWithDetails(Long requestId) {
        return requestRepository.findByIdWithDetails(requestId)
                .orElseThrow(() -> new ResourceNotFoundException("Yêu cầu duyệt không tồn tại: " + requestId));
    }

    private void ensurePending(ApprovalRequest request) {
        if (request.getStatus() != ApprovalRequestStatus.PENDING) {
            throw new BusinessException(ErrorCode.APPROVAL_002, "Yêu cầu không còn ở trạng thái PENDING");
        }
    }

    private ApprovalStep getPendingStep(ApprovalRequest request) {
        return request.getSteps().stream()
                .filter(s -> s.getStatus() == ApprovalStepStatus.PENDING)
                .findFirst()
                .orElseThrow(() -> new BusinessException(ErrorCode.APPROVAL_002,
                        "Không có cấp duyệt nào đang chờ xử lý"));
    }

    private void validateDecider(ApprovalStep step, User decider, User requester, Long projectId) {
        if (requester != null && decider.getId().equals(requester.getId())) {
            throw new BusinessException(ErrorCode.APPROVAL_003, "Không được tự duyệt yêu cầu của mình");
        }
        boolean eligible;
        if (step.getApproverRole() == ApprovalApproverRole.PM) {
            eligible = memberRepository.findByProjectIdAndUserId(projectId, decider.getId())
                    .map(m -> m.getRole() == ProjectRole.PM)
                    .orElse(false);
        } else {
            eligible = appAdminRepository.existsByUserId(decider.getId());
        }
        if (!eligible) {
            throw new BusinessException(ErrorCode.APPROVAL_003,
                    "Bạn không phải người duyệt ở cấp " + step.getLevel());
        }
    }

    private ApprovalStep findNextWaitingStep(ApprovalRequest request, int currentLevel) {
        return request.getSteps().stream()
                .filter(s -> s.getLevel() > currentLevel && s.getStatus() == ApprovalStepStatus.WAITING)
                .findFirst()
                .orElse(null);
    }

    private void notifyPendingApprovers(ApprovalRequest request, Project project, User requester) {
        ApprovalStep firstPending = request.getSteps().stream()
                .filter(s -> s.getStatus() == ApprovalStepStatus.PENDING)
                .findFirst().orElse(null);
        if (firstPending != null) {
            notifyStepApprovers(request, firstPending, project, requester);
        }
    }

    private void notifyStepApprovers(ApprovalRequest request, ApprovalStep step, Project project, User requester) {
        List<User> approvers = findApproversForStep(step, project.getId());
        if (!approvers.isEmpty()) {
            String title = "Yêu cầu duyệt mới: " + request.getType().name();
            String message = requester.getFullName() + " yêu cầu duyệt cho dự án " + project.getName();
            String link = "/projects/" + project.getId() + "/approval-requests/" + request.getId();
            notificationService.notify(NotificationType.APPROVAL_REQUESTED, approvers, title, message, link, null, requester);
        }
    }

    private List<User> findApproversForStep(ApprovalStep step, Long projectId) {
        if (step.getApproverRole() == ApprovalApproverRole.PM) {
            return memberRepository.findByProjectId(projectId).stream()
                    .filter(m -> m.getRole() == ProjectRole.PM)
                    .map(ProjectMember::getUser)
                    .collect(Collectors.toList());
        } else {
            return appAdminRepository.findAll().stream()
                    .filter(a -> a.getUser() != null)
                    .map(a -> a.getUser())
                    .collect(Collectors.toList());
        }
    }

    private void notifyRequester(ApprovalRequest request, Project project, User requester,
                                  String message, NotificationType type) {
        if (requester == null) return;
        String link = "/projects/" + project.getId() + "/approval-requests/" + request.getId();
        notificationService.notify(type, List.of(requester), "Yêu cầu duyệt: " + request.getType().name(),
                message, link, null, null);
    }

    private void correlateDecision(ApprovalRequest request, int level, String decision, String comment) {
        try {
            processEngineClient.correlateDecisionMessage(request.getId(), level,
                    Map.of("decision", decision, "comment", comment != null ? comment : ""));
        } catch (Exception e) {
            log.warn("Không thể correlate quyết định cho yêu cầu {}: {}", request.getId(), e.getMessage());
        }
    }
}
