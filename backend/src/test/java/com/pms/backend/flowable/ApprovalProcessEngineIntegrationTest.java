package com.pms.backend.flowable;

import com.pms.backend.config.ApprovalProperties;
import com.pms.backend.dao.ApprovalRequestRepository;
import com.pms.backend.delegate.ApplyChangeDelegate;
import com.pms.backend.delegate.EscalateDelegate;
import com.pms.backend.delegate.ExpireRequestDelegate;
import com.pms.backend.delegate.NotifyReminderDelegate;
import com.pms.backend.enu.ApprovalApplyStatus;
import com.pms.backend.enu.ApprovalRequestStatus;
import com.pms.backend.enu.ApprovalRequestType;
import com.pms.backend.enu.ApprovalStepStatus;
import com.pms.backend.job.ApprovalReconciliationJob;
import com.pms.backend.model.ApprovalRequest;
import com.pms.backend.model.ApprovalStep;
import com.pms.backend.model.Project;
import com.pms.backend.service.interfaces.IApprovalApplyService;
import com.pms.backend.service.interfaces.IApprovalRequestService;
import com.pms.backend.wrapper.FlowableProcessEngineClient;
import org.flowable.engine.ManagementService;
import org.flowable.engine.ProcessEngine;
import org.flowable.engine.ProcessEngineConfiguration;
import org.flowable.engine.RepositoryService;
import org.flowable.engine.RuntimeService;
import org.flowable.engine.impl.cfg.StandaloneInMemProcessEngineConfiguration;
import org.flowable.engine.repository.ProcessDefinition;
import org.flowable.engine.runtime.Execution;
import org.flowable.engine.runtime.ProcessInstance;
import org.flowable.job.api.Job;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

class ApprovalProcessEngineIntegrationTest {

    private ProcessEngine processEngine;
    private RepositoryService repositoryService;
    private RuntimeService runtimeService;
    private ManagementService managementService;
    private FlowableProcessEngineClient client;

    private IApprovalApplyService applyService;
    private IApprovalRequestService approvalRequestService;

    @BeforeEach
    void setUp() {
        applyService = mock(IApprovalApplyService.class);
        approvalRequestService = mock(IApprovalRequestService.class);

        ApplyChangeDelegate applyDelegate = new ApplyChangeDelegate(applyService);
        NotifyReminderDelegate reminderDelegate = new NotifyReminderDelegate(approvalRequestService);
        EscalateDelegate escalateDelegate = new EscalateDelegate(approvalRequestService);
        ExpireRequestDelegate expireDelegate = new ExpireRequestDelegate(approvalRequestService);

        Map<Object, Object> beans = new HashMap<>();
        beans.put("applyChangeDelegate", applyDelegate);
        beans.put("notifyReminderDelegate", reminderDelegate);
        beans.put("escalateDelegate", escalateDelegate);
        beans.put("expireRequestDelegate", expireDelegate);

        StandaloneInMemProcessEngineConfiguration config = new StandaloneInMemProcessEngineConfiguration();
        config.setJdbcUrl("jdbc:h2:mem:flowable_it_" + System.nanoTime() + ";DB_CLOSE_DELAY=-1");
        config.setDatabaseSchemaUpdate(ProcessEngineConfiguration.DB_SCHEMA_UPDATE_TRUE);
        config.setBeans(beans);

        processEngine = config.buildProcessEngine();
        repositoryService = processEngine.getRepositoryService();
        runtimeService = processEngine.getRuntimeService();
        managementService = processEngine.getManagementService();

        // Deploy BPMN definition
        repositoryService.createDeployment()
                .addClasspathResource("bpmn/approval-request.bpmn")
                .deploy();

        client = new FlowableProcessEngineClient(processEngine, runtimeService);
    }

    @AfterEach
    void tearDown() {
        if (processEngine != null) {
            processEngine.close();
        }
    }

    @Test
    @DisplayName("BPMN nạp được thành công vào Flowable engine và là executable")
    void testBpmnDeployment() {
        ProcessDefinition definition = repositoryService.createProcessDefinitionQuery()
                .processDefinitionKey("approval-request")
                .latestVersion()
                .singleResult();

        assertThat(definition).isNotNull();
        assertThat(definition.getName()).isEqualTo("Quy trình duyệt nhiều cấp");
    }

    @Test
    @DisplayName("Luồng duyệt đủ 2 cấp: Cấp 1 APPROVED -> Cấp 2 APPROVED -> Áp dụng thay đổi")
    void testFullApprovalFlow_TwoLevels() {
        Long requestId = 1001L;
        Map<String, Object> vars = new HashMap<>();
        vars.put("level1Status", "PENDING");
        vars.put("level2Status", "PENDING");
        vars.put("reminderDuration", "PT24H");
        vars.put("escalateDuration", "PT72H");
        vars.put("expireDuration", "P14D");

        Optional<String> instanceIdOpt = client.startApprovalProcess(requestId, vars);
        assertThat(instanceIdOpt).isPresent();
        String instanceId = instanceIdOpt.get();

        // Kiểm tra tiến trình đang chờ ở Cấp 1
        List<Execution> waitingL1 = runtimeService.createExecutionQuery()
                .messageEventSubscriptionName("decisionMessage_level1")
                .processInstanceId(instanceId)
                .list();
        assertThat(waitingL1).hasSize(1);

        // Gửi thông điệp duyệt Cấp 1: APPROVED
        client.correlateDecisionMessage(requestId, 1, Map.of("decision", "APPROVED"));

        // Kiểm tra tiến trình đã chuyển sang chờ Cấp 2
        List<Execution> waitingL2 = runtimeService.createExecutionQuery()
                .messageEventSubscriptionName("decisionMessage_level2")
                .processInstanceId(instanceId)
                .list();
        assertThat(waitingL2).hasSize(1);

        // Gửi thông điệp duyệt Cấp 2: APPROVED
        client.correlateDecisionMessage(requestId, 2, Map.of("decision", "APPROVED"));

        // Xác nhận tiến trình đã kết thúc và applyService.apply(1001L) được gọi
        ProcessInstance instance = runtimeService.createProcessInstanceQuery()
                .processInstanceId(instanceId)
                .singleResult();
        assertThat(instance).isNull(); // đã kết thúc
        verify(applyService, times(1)).apply(requestId);
    }

    @Test
    @DisplayName("Luồng 1 cấp (Cấp 2 SKIPPED): Cấp 1 APPROVED -> Áp dụng thay đổi ngay")
    void testSingleLevelApproval_Level2Skipped() {
        Long requestId = 1002L;
        Map<String, Object> vars = new HashMap<>();
        vars.put("level1Status", "PENDING");
        vars.put("level2Status", "SKIPPED");
        vars.put("reminderDuration", "PT24H");
        vars.put("escalateDuration", "PT72H");
        vars.put("expireDuration", "P14D");

        Optional<String> instanceIdOpt = client.startApprovalProcess(requestId, vars);
        assertThat(instanceIdOpt).isPresent();
        String instanceId = instanceIdOpt.get();

        // Gửi duyệt Cấp 1
        client.correlateDecisionMessage(requestId, 1, Map.of("decision", "APPROVED"));

        // Tiến trình kết thúc ngay vì Cấp 2 đã SKIPPED
        ProcessInstance instance = runtimeService.createProcessInstanceQuery()
                .processInstanceId(instanceId)
                .singleResult();
        assertThat(instance).isNull();
        verify(applyService, times(1)).apply(requestId);
    }

    @Test
    @DisplayName("Luồng từ chối (REJECTED): Cấp 1 từ chối -> Quy trình kết thúc, không gọi apply")
    void testRejectFlow() {
        Long requestId = 1003L;
        Map<String, Object> vars = new HashMap<>();
        vars.put("level1Status", "PENDING");
        vars.put("level2Status", "PENDING");
        vars.put("reminderDuration", "PT24H");
        vars.put("escalateDuration", "PT72H");
        vars.put("expireDuration", "P14D");

        Optional<String> instanceIdOpt = client.startApprovalProcess(requestId, vars);
        assertThat(instanceIdOpt).isPresent();
        String instanceId = instanceIdOpt.get();

        // Gửi REJECTED
        client.correlateDecisionMessage(requestId, 1, Map.of("decision", "REJECTED"));

        ProcessInstance instance = runtimeService.createProcessInstanceQuery()
                .processInstanceId(instanceId)
                .singleResult();
        assertThat(instance).isNull();
        verify(applyService, never()).apply(anyLong());
    }

    @Test
    @DisplayName("Luồng hết hạn (Expire): Boundary timer kích hoạt expireRequestDelegate và kết thúc quy trình")
    void testExpireFlow_Timer() {
        Long requestId = 1004L;
        Map<String, Object> vars = new HashMap<>();
        vars.put("level1Status", "PENDING");
        vars.put("level2Status", "PENDING");
        vars.put("reminderDuration", "PT10M");
        vars.put("escalateDuration", "PT20M");
        vars.put("expireDuration", "PT1S"); // Hết hạn sau 1 giây

        Optional<String> instanceIdOpt = client.startApprovalProcess(requestId, vars);
        assertThat(instanceIdOpt).isPresent();
        String instanceId = instanceIdOpt.get();

        // Tìm timer job của expire
        List<Job> timerJobs = managementService.createTimerJobQuery()
                .processInstanceId(instanceId)
                .list();
        assertThat(timerJobs).isNotEmpty();

        // Tìm timer job expire (gắn với boundary timerExpireL1)
        Job expireTimer = timerJobs.stream()
                .filter(j -> "timerExpireL1".equals(j.getElementId()))
                .findFirst()
                .orElse(timerJobs.get(0));

        // Kích hoạt timer job
        Job executableJob = managementService.moveTimerToExecutableJob(expireTimer.getId());
        managementService.executeJob(executableJob.getId());

        // Kiểm tra expireRequestDelegate được gọi
        verify(approvalRequestService, times(1)).expire(requestId);

        // Quy trình kết thúc
        ProcessInstance instance = runtimeService.createProcessInstanceQuery()
                .processInstanceId(instanceId)
                .singleResult();
        assertThat(instance).isNull();
        verify(applyService, never()).apply(anyLong());
    }

    @Test
    @DisplayName("Job đối soát ApprovalReconciliationJob: Quét yêu cầu PENDING chưa có key và start lại")
    void testReconciliationJob() {
        ApprovalRequestRepository requestRepo = mock(ApprovalRequestRepository.class);
        ApprovalProperties props = new ApprovalProperties();

        ApprovalRequest req = new ApprovalRequest();
        req.setId(2001L);
        req.setStatus(ApprovalRequestStatus.PENDING);
        req.setType(ApprovalRequestType.PROJECT_CLOSE);
        Project project = new Project();
        project.setId(10L);
        req.setProject(project);

        ApprovalStep step1 = new ApprovalStep();
        step1.setLevel(1);
        step1.setStatus(ApprovalStepStatus.PENDING);
        req.setSteps(List.of(step1));

        when(requestRepo.findByStatusAndProcessInstanceKeyIsNull(ApprovalRequestStatus.PENDING))
                .thenReturn(List.of(req));

        ApprovalReconciliationJob job = new ApprovalReconciliationJob(
                requestRepo, client, approvalRequestService, props);

        job.reconcilePendingRequests();

        // Xác nhận client đã khởi động process và gọi updateProcessInstanceKey
        verify(approvalRequestService, times(1)).updateProcessInstanceKey(eq(2001L), Mockito.anyString());
    }
}
