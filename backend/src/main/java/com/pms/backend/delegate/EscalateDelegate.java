package com.pms.backend.delegate;

import com.pms.backend.service.interfaces.IApprovalRequestService;
import org.flowable.engine.delegate.DelegateExecution;
import org.flowable.engine.delegate.JavaDelegate;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

@Component("escalateDelegate")
public class EscalateDelegate implements JavaDelegate {

    private static final Logger log = LoggerFactory.getLogger(EscalateDelegate.class);

    private final IApprovalRequestService approvalRequestService;

    public EscalateDelegate(IApprovalRequestService approvalRequestService) {
        this.approvalRequestService = approvalRequestService;
    }

    @Override
    public void execute(DelegateExecution execution) {
        Long requestId = (Long) execution.getVariable("requestId");
        if (requestId == null && execution.getProcessInstanceBusinessKey() != null) {
            requestId = Long.parseLong(execution.getProcessInstanceBusinessKey());
        }

        log.info("EscalateDelegate executing for requestId={}", requestId);
        try {
            if (requestId != null) {
                approvalRequestService.escalate(requestId);
            }
        } finally {
            SecurityContextHolder.clearContext();
        }
    }
}
