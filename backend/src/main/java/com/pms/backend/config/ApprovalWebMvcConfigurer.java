package com.pms.backend.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class ApprovalWebMvcConfigurer implements WebMvcConfigurer {

    private final ApprovalProperties approvalProperties;
    private final ObjectMapper objectMapper;

    public ApprovalWebMvcConfigurer(ApprovalProperties approvalProperties, ObjectMapper objectMapper) {
        this.approvalProperties = approvalProperties;
        this.objectMapper = objectMapper;
    }

    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        registry.addInterceptor(new ApprovalPolicyInterceptor(approvalProperties, objectMapper))
                .addPathPatterns(
                        "/api/projects/*/close",
                        "/api/projects/*/workflow",
                        "/projects/*/workflow"
                );
    }
}
