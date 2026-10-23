package com.pms.backend.common;

import org.aspectj.lang.JoinPoint;
import org.aspectj.lang.annotation.AfterReturning;
import org.aspectj.lang.annotation.Aspect;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

@Aspect
@Component
public class AuditLogAspect {
    private static final Logger logger = LoggerFactory.getLogger(AuditLogAspect.class);

    @AfterReturning(pointcut = "execution(* com.pms.backend.service..*.create*(..)) || execution(* com.pms.backend.service..*.update*(..)) || execution(* com.pms.backend.service..*.delete*(..)) || execution(* com.pms.backend.service..*.change*(..))", returning = "result")
    public void logAfterReturning(JoinPoint joinPoint, Object result) {
        String methodName = joinPoint.getSignature().getName();
        String username = "system";
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.isAuthenticated() && !authentication.getPrincipal().equals("anonymousUser")) {
            username = authentication.getName();
        }
        
        logger.info("AUDIT LOG - User: {} - Action: {} - Result: {}", username, methodName, result != null ? result.getClass().getSimpleName() : "void");
    }
}
