package com.pms.backend.wrapper;

import java.util.Map;
import java.util.Optional;

public interface ProcessEngineClient {
    Optional<String> startApprovalProcess(Long requestId, Map<String, Object> variables);
    void correlateDecisionMessage(Long requestId, int level, Map<String, Object> variables);
    void cancelProcess(String processInstanceKey, String reason);
    boolean isHealthy();
}
