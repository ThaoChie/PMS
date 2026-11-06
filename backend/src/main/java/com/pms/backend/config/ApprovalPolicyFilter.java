package com.pms.backend.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.pms.backend.common.ApiResponse;
import com.pms.backend.enu.ErrorCode;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

@Component
@Order(Ordered.HIGHEST_PRECEDENCE + 50)
public class ApprovalPolicyFilter extends OncePerRequestFilter {

    private final ApprovalProperties approvalProperties;
    private final ObjectMapper objectMapper;

    public ApprovalPolicyFilter(ApprovalProperties approvalProperties, ObjectMapper objectMapper) {
        this.approvalProperties = approvalProperties;
        this.objectMapper = objectMapper;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {

        String method = request.getMethod();
        String uri = request.getRequestURI();

        if (("POST".equalsIgnoreCase(method) || "PUT".equalsIgnoreCase(method)) && isProjectCloseUri(uri)) {
            if (approvalProperties.isProjectCloseEnabled()) {
                rejectWithApproval005(response);
                return;
            }
        }

        if (("PUT".equalsIgnoreCase(method) || "POST".equalsIgnoreCase(method)) && isWorkflowUpdateUri(uri)) {
            if (approvalProperties.isWorkflowChangeEnabled()) {
                rejectWithApproval005(response);
                return;
            }
        }

        filterChain.doFilter(request, response);
    }

    private boolean isProjectCloseUri(String uri) {
        return uri.matches(".*/api/projects/\\d+/close/?$")
                || uri.matches(".*/projects/\\d+/close/?$");
    }

    private boolean isWorkflowUpdateUri(String uri) {
        return uri.matches(".*/api/projects/\\d+/workflow/?$")
                || uri.matches(".*/projects/\\d+/workflow/?$");
    }

    private void rejectWithApproval005(HttpServletResponse response) throws IOException {
        response.setStatus(422);
        response.setContentType("application/json;charset=UTF-8");
        ApiResponse<Void> body = ApiResponse.error(ErrorCode.APPROVAL_005.getDefaultMessage());
        response.getWriter().write(objectMapper.writeValueAsString(body));
    }
}
