package com.pms.backend.service.impl;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.pms.backend.dao.ApprovalRequestRepository;
import com.pms.backend.dao.UserRepository;
import com.pms.backend.dto.SaveWorkflowRequest;
import com.pms.backend.enu.ApprovalApplyStatus;
import com.pms.backend.enu.ApprovalApproverRole;
import com.pms.backend.enu.ApprovalStepStatus;
import com.pms.backend.enu.ErrorCode;
import com.pms.backend.enu.NotificationType;
import com.pms.backend.exception.ResourceNotFoundException;
import com.pms.backend.model.ApprovalRequest;
import com.pms.backend.model.ApprovalStep;
import com.pms.backend.model.User;
import com.pms.backend.security.AuthUserPrincipal;
import com.pms.backend.service.interfaces.IApprovalApplyService;
import com.pms.backend.service.interfaces.INotificationService;
import com.pms.backend.service.interfaces.IProjectService;
import com.pms.backend.service.interfaces.IWorkflowService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class ApprovalApplyServiceImpl implements IApprovalApplyService {

    private static final Logger log = LoggerFactory.getLogger(ApprovalApplyServiceImpl.class);

    private final ApprovalRequestRepository requestRepository;
    private final UserRepository userRepository;
    private final IProjectService projectService;
    private final IWorkflowService workflowService;
    private final INotificationService notificationService;
    private final ObjectMapper objectMapper;

    public ApprovalApplyServiceImpl(ApprovalRequestRepository requestRepository,
                                     UserRepository userRepository,
                                     IProjectService projectService,
                                     IWorkflowService workflowService,
                                     INotificationService notificationService,
                                     ObjectMapper objectMapper) {
        this.requestRepository = requestRepository;
        this.userRepository = userRepository;
        this.projectService = projectService;
        this.workflowService = workflowService;
        this.notificationService = notificationService;
        this.objectMapper = objectMapper;
    }

    @Override
    @Transactional
    public void apply(Long requestId) {
        ApprovalRequest request = requestRepository.findByIdWithDetails(requestId)
                .orElseThrow(() -> new ResourceNotFoundException("Yêu cầu duyệt không tồn tại: " + requestId));

        if (request.getApplyStatus() == ApprovalApplyStatus.APPLIED) {
            log.info("Yêu cầu {} đã được áp dụng (idempotent skip)", requestId);
            return;
        }

        User performer = findLastApprover(request);
        setSecurityContext(performer);
        try {
            switch (request.getType()) {
                case PROJECT_CLOSE -> projectService.closeProject(request.getProject().getId());
                case WORKFLOW_CONFIG_CHANGE -> {
                    SaveWorkflowRequest wfReq = objectMapper.readValue(
                            request.getPayloadJson(), SaveWorkflowRequest.class);
                    workflowService.updateWorkflow(request.getProject().getId(), wfReq);
                }
            }
            request.setApplyStatus(ApprovalApplyStatus.APPLIED);
            requestRepository.save(request);
            log.info("Áp dụng thành công yêu cầu {} ({})", requestId, request.getType());
        } catch (Exception e) {
            log.error("Áp dụng thất bại cho yêu cầu {}: {}", requestId, e.getMessage());
            request.setApplyStatus(ApprovalApplyStatus.FAILED);
            request.setApplyError(e.getMessage());
            requestRepository.save(request);
            notifyApplyFailed(request);
        } finally {
            SecurityContextHolder.clearContext();
        }
    }

    private User findLastApprover(ApprovalRequest request) {
        return request.getSteps().stream()
                .filter(s -> s.getStatus() == ApprovalStepStatus.APPROVED
                        && s.getApproverRole() == ApprovalApproverRole.ADMIN)
                .map(ApprovalStep::getDecidedBy)
                .filter(u -> u != null)
                .findFirst()
                .or(() -> request.getSteps().stream()
                        .filter(s -> s.getStatus() == ApprovalStepStatus.APPROVED)
                        .map(ApprovalStep::getDecidedBy)
                        .filter(u -> u != null)
                        .findFirst())
                .orElse(null);
    }

    private void setSecurityContext(User user) {
        String principal = (user != null) ? user.getEmail() : "SYSTEM";
        var auth = new UsernamePasswordAuthenticationToken(principal, null,
                List.of(new SimpleGrantedAuthority("ROLE_USER")));
        if (user != null) {
            auth = new UsernamePasswordAuthenticationToken(
                    AuthUserPrincipal.create(user), null,
                    List.of(new SimpleGrantedAuthority("ROLE_USER")));
        }
        SecurityContextHolder.getContext().setAuthentication(auth);
    }

    private void notifyApplyFailed(ApprovalRequest request) {
        try {
            if (request.getRequester() != null) {
                String msg = "Áp dụng thay đổi thất bại cho yêu cầu duyệt #" + request.getId()
                        + ". Lỗi: " + request.getApplyError();
                notificationService.notify(NotificationType.APPROVAL_RESULT,
                        List.of(request.getRequester()),
                        "Áp dụng thất bại", msg,
                        "/projects/" + request.getProject().getId() + "/approval-requests/" + request.getId(),
                        null, null);
            }
        } catch (Exception e) {
            log.warn("Không thể gửi thông báo lỗi áp dụng: {}", e.getMessage());
        }
    }
}
