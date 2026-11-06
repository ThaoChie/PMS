package com.pms.backend.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.pms.backend.common.ApiResponse;
import com.pms.backend.enu.ErrorCode;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.web.servlet.HandlerInterceptor;

public class ApprovalPolicyInterceptor implements HandlerInterceptor {

    private final ApprovalProperties approvalProperties;
    private final ObjectMapper objectMapper;

    public ApprovalPolicyInterceptor(ApprovalProperties approvalProperties, ObjectMapper objectMapper) {
        this.approvalProperties = approvalProperties;
        this.objectMapper = objectMapper;
    }

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) throws Exception {
        String method = request.getMethod();
        String uri = request.getRequestURI();

        if ("POST".equalsIgnoreCase(method) && isProjectCloseUri(uri)) {
            if (approvalProperties.isProjectCloseEnabled()) {
                return rejectWithApproval005(response);
            }
        }

        if ("PUT".equalsIgnoreCase(method) && isWorkflowUpdateUri(uri)) {
            if (approvalProperties.isWorkflowChangeEnabled()) {
                return rejectWithApproval005(response);
            }
        }

        return true;
    }

    private boolean isProjectCloseUri(String uri) {
        return uri.matches(".*/api/projects/\\d+/close$");
    }

    private boolean isWorkflowUpdateUri(String uri) {
        return uri.matches(".*/api/projects/\\d+/workflow$")
                || uri.matches(".*/projects/\\d+/workflow$");
    }

    private boolean rejectWithApproval005(HttpServletResponse response) throws Exception {
        response.setStatus(422);
        response.setContentType("application/json;charset=UTF-8");
        ApiResponse<Void> body = ApiResponse.error(ErrorCode.APPROVAL_005.getDefaultMessage());
        response.getWriter().write(objectMapper.writeValueAsString(body));
        return false;
    }
}
