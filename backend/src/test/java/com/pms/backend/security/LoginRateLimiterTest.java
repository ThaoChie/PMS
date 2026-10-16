package com.pms.backend.security;

import com.pms.backend.enu.ErrorCode;
import com.pms.backend.exception.BusinessException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

public class LoginRateLimiterTest {

    private LoginRateLimiter rateLimiter;

    @BeforeEach
    public void setup() {
        rateLimiter = new LoginRateLimiter();
    }

    @Test
    public void testUnderThreshold_AllowsAttempts() {
        for (int i = 0; i < 4; i++) {
            rateLimiter.recordFailedAttempt("test@epms.com");
        }
        assertDoesNotThrow(() -> rateLimiter.checkBlocked("test@epms.com"));
    }

    @Test
    public void testExceedThreshold_BlocksAndThrowsTooManyRequests() {
        for (int i = 0; i < 5; i++) {
            rateLimiter.recordFailedAttempt("attacker@epms.com");
        }

        BusinessException ex = assertThrows(BusinessException.class, () -> {
            rateLimiter.checkBlocked("attacker@epms.com");
        });

        assertEquals(ErrorCode.TOO_MANY_REQUESTS, ex.getErrorCode());
        assertTrue(ex.getMessage().contains("5 lần"));
    }

    @Test
    public void testSuccess_ResetsAttempts() {
        for (int i = 0; i < 4; i++) {
            rateLimiter.recordFailedAttempt("user@epms.com");
        }
        rateLimiter.recordSuccess("user@epms.com");

        // Can record more without immediately getting blocked
        for (int i = 0; i < 4; i++) {
            rateLimiter.recordFailedAttempt("user@epms.com");
        }
        assertDoesNotThrow(() -> rateLimiter.checkBlocked("user@epms.com"));
    }
}
