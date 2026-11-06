package com.pms.backend.wrapper;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.Map;
import java.util.Optional;

public class NoOpProcessEngineClient implements ProcessEngineClient {

    private static final Logger log = LoggerFactory.getLogger(NoOpProcessEngineClient.class);

    @Override
    public Optional<String> startApprovalProcess(Long requestId, Map<String, Object> variables) {
        log.debug("NoOp: startApprovalProcess requestId={}", requestId);
        return Optional.empty();
    }

    @Override
    public void correlateDecisionMessage(Long requestId, int level, Map<String, Object> variables) {
        log.debug("NoOp: correlateDecisionMessage requestId={}, level={}", requestId, level);
    }

    @Override
    public void cancelProcess(String processInstanceKey, String reason) {
        log.debug("NoOp: cancelProcess instanceKey={}", processInstanceKey);
    }

    @Override
    public boolean isHealthy() {
        return true;
    }
}
