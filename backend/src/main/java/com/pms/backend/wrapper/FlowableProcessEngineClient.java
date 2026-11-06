package com.pms.backend.wrapper;

import org.flowable.engine.ProcessEngine;
import org.flowable.engine.RuntimeService;
import org.flowable.engine.runtime.Execution;
import org.flowable.engine.runtime.ProcessInstance;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

public class FlowableProcessEngineClient implements ProcessEngineClient {

    private static final Logger log = LoggerFactory.getLogger(FlowableProcessEngineClient.class);
    public static final String PROCESS_KEY = "approval-request";

    private final ProcessEngine processEngine;
    private final RuntimeService runtimeService;

    public FlowableProcessEngineClient(ProcessEngine processEngine, RuntimeService runtimeService) {
        this.processEngine = processEngine;
        this.runtimeService = runtimeService;
    }

    @Override
    public Optional<String> startApprovalProcess(Long requestId, Map<String, Object> variables) {
        try {
            Map<String, Object> vars = variables != null ? new HashMap<>(variables) : new HashMap<>();
            vars.put("requestId", requestId);

            long count = processEngine.getRepositoryService().createProcessDefinitionQuery()
                    .processDefinitionKey(PROCESS_KEY)
                    .count();
            if (count == 0) {
                log.warn("Flowable process definition '{}' not yet deployed. Skipping start for requestId={}", PROCESS_KEY, requestId);
                return Optional.empty();
            }

            ProcessInstance instance = runtimeService.startProcessInstanceByKey(PROCESS_KEY, String.valueOf(requestId), vars);
            log.info("Started Flowable process instance id={} for requestId={}", instance.getId(), requestId);
            return Optional.ofNullable(instance.getId());
        } catch (Exception e) {
            log.error("Failed to start Flowable process for requestId={}: {}", requestId, e.getMessage(), e);
            return Optional.empty();
        }
    }

    @Override
    public void correlateDecisionMessage(Long requestId, int level, Map<String, Object> variables) {
        try {
            String messageName = "decisionMessage_level" + level;
            List<Execution> executions = runtimeService.createExecutionQuery()
                    .messageEventSubscriptionName(messageName)
                    .processVariableValueEquals("requestId", requestId)
                    .list();

            if (executions.isEmpty()) {
                executions = runtimeService.createExecutionQuery()
                        .messageEventSubscriptionName(messageName)
                        .processInstanceBusinessKey(String.valueOf(requestId))
                        .list();
            }

            if (!executions.isEmpty()) {
                for (Execution execution : executions) {
                    runtimeService.messageEventReceived(messageName, execution.getId(), variables);
                    log.info("Correlated message {} to execution id={} for requestId={}", messageName, execution.getId(), requestId);
                }
            } else {
                log.warn("No active execution waiting for message '{}' with requestId={}", messageName, requestId);
            }
        } catch (Exception e) {
            log.error("Error correlating decision message for requestId={}, level={}: {}", requestId, level, e.getMessage(), e);
        }
    }

    @Override
    public void cancelProcess(String processInstanceKey, String reason) {
        if (processInstanceKey == null || processInstanceKey.isBlank()) {
            return;
        }
        try {
            runtimeService.deleteProcessInstance(processInstanceKey, reason);
            log.info("Deleted Flowable process instance id={} with reason: {}", processInstanceKey, reason);
        } catch (Exception e) {
            log.error("Error cancelling process instance {}: {}", processInstanceKey, e.getMessage(), e);
        }
    }

    @Override
    public boolean isHealthy() {
        try {
            return processEngine != null && processEngine.getName() != null;
        } catch (Exception e) {
            return false;
        }
    }
}
