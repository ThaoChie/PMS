package com.pms.backend.security;

import com.pms.backend.enu.ErrorCode;
import com.pms.backend.exception.BusinessException;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Component
public class LoginRateLimiter {

    private static final int MAX_ATTEMPTS = 5;
    private static final long LOCK_DURATION_SECONDS = 15 * 60; // 15 minutes

    private static class AttemptRecord {
        int attempts;
        Instant firstAttemptTime;
        Instant lockedUntil;

        AttemptRecord() {
            this.attempts = 1;
            this.firstAttemptTime = Instant.now();
            this.lockedUntil = null;
        }
    }

    private final Map<String, AttemptRecord> records = new ConcurrentHashMap<>();

    public void checkBlocked(String key) {
        if (key == null || key.isBlank()) return;
        AttemptRecord record = records.get(key.toLowerCase());
        if (record != null && record.lockedUntil != null) {
            if (Instant.now().isBefore(record.lockedUntil)) {
                throw new BusinessException(ErrorCode.TOO_MANY_REQUESTS, "Tài khoản tạm thời bị khóa do đăng nhập sai quá 5 lần. Vui lòng thử lại sau 15 phút.");
            } else {
                records.remove(key.toLowerCase());
            }
        }
    }

    public void recordFailedAttempt(String key) {
        if (key == null || key.isBlank()) return;
        String lowerKey = key.toLowerCase();
        records.compute(lowerKey, (k, existing) -> {
            Instant now = Instant.now();
            if (existing == null) {
                return new AttemptRecord();
            }
            if (existing.lockedUntil != null && now.isAfter(existing.lockedUntil)) {
                // Window expired
                return new AttemptRecord();
            }
            // If more than 15 mins since first attempt, reset
            if (now.isAfter(existing.firstAttemptTime.plusSeconds(LOCK_DURATION_SECONDS))) {
                return new AttemptRecord();
            }

            existing.attempts++;
            if (existing.attempts >= MAX_ATTEMPTS) {
                existing.lockedUntil = now.plusSeconds(LOCK_DURATION_SECONDS);
            }
            return existing;
        });
    }

    public void recordSuccess(String key) {
        if (key != null) {
            records.remove(key.toLowerCase());
        }
    }

    public void reset() {
        records.clear();
    }
}
