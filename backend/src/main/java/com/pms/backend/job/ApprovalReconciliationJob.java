package com.pms.backend.job;

import com.pms.backend.config.ApprovalProperties;
import com.pms.backend.dao.ApprovalRequestRepository;
import com.pms.backend.enu.ApprovalRequestStatus;
import com.pms.backend.model.ApprovalRequest;
import com.pms.backend.model.ApprovalStep;
import com.pms.backend.service.interfaces.IApprovalRequestService;
import com.pms.backend.wrapper.ProcessEngineClient;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Component
@ConditionalOnProperty(name = "camunda.enabled", havingValue = "true")
public class ApprovalReconciliationJob {

    private static final Logger log = LoggerFactory.getLogger(ApprovalReconciliationJob.class);

    private final ApprovalRequestRepository requestRepository;
    private final ProcessEngineClient processEngineClient;
    private final IApprovalRequestService approvalRequestService;
    private final ApprovalProperties approvalProperties;

    public ApprovalReconciliationJob(ApprovalRequestRepository requestRepository,
                                     ProcessEngineClient processEngineClient,
                                     IApprovalRequestService approvalRequestService,
                                     ApprovalProperties approvalProperties) {
        this.requestRepository = requestRepository;
        this.processEngineClient = processEngineClient;
        this.approvalRequestService = approvalRequestService;
        this.approvalProperties = approvalProperties;
    }

    @Scheduled(fixedDelayString = "${approval.reconciliation-interval-ms:60000}")
    public void reconcilePendingRequests() {
        List<ApprovalRequest> unlinkedRequests = requestRepository.findByStatusAndProcessInstanceKeyIsNull(ApprovalRequestStatus.PENDING);
        if (unlinkedRequests.isEmpty()) {
            return;
        }

        log.info("Tìm thấy {} yêu cầu PENDING chưa có process_instance_key. Đang đối soát và khởi động lại quy trình...", unlinkedRequests.size());
        for (ApprovalRequest request : unlinkedRequests) {
            try {
                // Kiểm tra trước nếu process instance đã chạy trên engine cho businessKey này (tránh start trùng khi lặp/nhiều instance)
                java.util.Optional<String> existingKey = processEngineClient.findProcessInstanceIdByBusinessKey(request.getId());
                if (existingKey.isPresent()) {
                    approvalRequestService.updateProcessInstanceKey(request.getId(), existingKey.get());
                    log.info("Đối soát: Yêu cầu #{} đã tồn tại processInstanceKey={} trên engine. Cập nhật DB PMS, không start mới.",
                            request.getId(), existingKey.get());
                    continue;
                }

                Map<String, Object> vars = new HashMap<>();
                vars.put("requestId", request.getId());
                vars.put("projectId", request.getProject().getId());
                vars.put("type", request.getType().name());

                List<ApprovalStep> steps = request.getSteps();
                vars.put("level1Status", !steps.isEmpty() ? steps.get(0).getStatus().name() : "PENDING");
                vars.put("level2Status", steps.size() > 1 ? steps.get(1).getStatus().name() : "SKIPPED");
                vars.put("reminderDuration", approvalProperties != null ? "PT" + approvalProperties.getReminderAfterHours() + "H" : "PT24H");
                vars.put("escalateDuration", approvalProperties != null ? "PT" + approvalProperties.getEscalateAfterHours() + "H" : "PT72H");
                vars.put("expireDuration", approvalProperties != null ? "P" + approvalProperties.getExpireAfterDays() + "D" : "P14D");

                processEngineClient.startApprovalProcess(request.getId(), vars)
                        .ifPresent(key -> {
                            approvalRequestService.updateProcessInstanceKey(request.getId(), key);
                            log.info("Đối soát thành công cho yêu cầu #{}: gán processInstanceKey={}", request.getId(), key);
                        });
            } catch (Exception e) {
                log.error("Đối soát thất bại cho yêu cầu #{}: {}", request.getId(), e.getMessage());
            }
        }
    }
}
