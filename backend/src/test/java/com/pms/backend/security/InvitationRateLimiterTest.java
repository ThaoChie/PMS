package com.pms.backend.security;

import com.pms.backend.config.AppProperties;
import com.pms.backend.enu.ErrorCode;
import com.pms.backend.exception.BusinessException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

public class InvitationRateLimiterTest {

    private AppProperties appProperties;
    private InvitationRateLimiter rateLimiter;

    @BeforeEach
    public void setup() {
        appProperties = new AppProperties();
        appProperties.getInvitation().setMaxPerMinutePerUser(3);
        appProperties.getInvitation().setMaxPerHourPerProject(5);
        rateLimiter = new InvitationRateLimiter(appProperties);
    }

    @Test
    @DisplayName("Chặn khi một người dùng bấm mời liên tục vượt ngưỡng mỗi phút")
    public void testExceedPerUserMinuteLimit_ThrowsTooManyRequests() {
        rateLimiter.checkAndRecord(10L, 1L);
        rateLimiter.checkAndRecord(10L, 1L);
        rateLimiter.checkAndRecord(10L, 1L);

        BusinessException ex = assertThrows(BusinessException.class, () ->
                rateLimiter.checkAndRecord(10L, 1L));

        assertEquals(ErrorCode.TOO_MANY_REQUESTS, ex.getErrorCode());
        assertTrue(ex.getMessage().contains("quá nhanh"));
    }

    @Test
    @DisplayName("Chặn khi tổng lời mời của một dự án vượt ngưỡng mỗi giờ")
    public void testExceedPerProjectHourLimit_ThrowsTooManyRequests() {
        rateLimiter.checkAndRecord(10L, 99L);
        rateLimiter.checkAndRecord(10L, 99L);
        rateLimiter.checkAndRecord(11L, 99L);
        rateLimiter.checkAndRecord(11L, 99L);
        rateLimiter.checkAndRecord(12L, 99L);

        BusinessException ex = assertThrows(BusinessException.class, () ->
                rateLimiter.checkAndRecord(12L, 99L));

        assertEquals(ErrorCode.TOO_MANY_REQUESTS, ex.getErrorCode());
        assertTrue(ex.getMessage().contains("giới hạn gửi lời mời trong giờ"));

        // Đảm bảo hạn mức cá nhân của user 12 (mới dùng 1/3) không bị đốt oan khi dự án 99 đầy quota:
        // user 12 vẫn mời bình thường ở dự án khác (project 100) thêm 2 lần nữa
        assertDoesNotThrow(() -> rateLimiter.checkAndRecord(12L, 100L));
        assertDoesNotThrow(() -> rateLimiter.checkAndRecord(12L, 100L));
    }

    @Test
    @DisplayName("reset() xóa sạch bộ đếm")
    public void testReset_ClearsCounters() {
        rateLimiter.checkAndRecord(10L, 1L);
        rateLimiter.checkAndRecord(10L, 1L);
        rateLimiter.checkAndRecord(10L, 1L);

        rateLimiter.reset();

        assertDoesNotThrow(() -> rateLimiter.checkAndRecord(10L, 1L));
    }
}
