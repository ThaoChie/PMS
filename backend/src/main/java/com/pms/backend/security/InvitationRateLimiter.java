package com.pms.backend.security;

import com.pms.backend.config.AppProperties;
import com.pms.backend.enu.ErrorCode;
import com.pms.backend.exception.BusinessException;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Bộ giới hạn tần suất gửi lời mời tham gia dự án (In-memory Rate Limiter).
 * Bảo vệ hệ thống khỏi hành vi spam click liên tục gây quá tải CSDL và hàng đợi gửi email.
 */
@Component
public class InvitationRateLimiter {

    private static final long USER_WINDOW_SECONDS = 60L;
    private static final long PROJECT_WINDOW_SECONDS = 3600L;
    private static final int EVICT_THRESHOLD = 1000;
    private static final int MAX_BUCKETS = 5000;

    private static class WindowBucket {
        int count;
        Instant windowStart;
        long windowSeconds;

        WindowBucket(Instant now, long windowSeconds) {
            this.count = 0;
            this.windowStart = now;
            this.windowSeconds = windowSeconds;
        }

        boolean isExpired(Instant now) {
            return now.isAfter(windowStart.plusSeconds(windowSeconds));
        }
    }

    private final Map<String, WindowBucket> buckets = new ConcurrentHashMap<>();
    private final AppProperties appProperties;

    public InvitationRateLimiter(AppProperties appProperties) {
        this.appProperties = appProperties;
    }

    /**
     * Kiểm tra giới hạn tần suất thao tác theo từng người gửi (chặn spam click ngay từ đầu request).
     */
    public void checkUserRate(Long inviterId) {
        if (inviterId == null) return;
        Instant now = Instant.now();
        evictIfNeeded(now);

        int maxPerMinute = resolveMaxPerMinute();
        if (maxPerMinute > 0) {
            acquireSlot("user:" + inviterId, maxPerMinute, USER_WINDOW_SECONDS, now,
                    "Bạn đang gửi lời mời quá nhanh (tối đa " + maxPerMinute + " lời mời/phút). Vui lòng đợi ít phút rồi thử lại.");
        }
    }

    /**
     * Ghi nhận và kiểm tra hạn mức gửi lời mời thực tế của toàn dự án trong 1 giờ.
     * Chỉ gọi sau khi đã qua bước kiểm tra trùng lặp để tránh thành viên spam lỗi làm cạn quota của PM.
     */
    public void checkProjectRate(Long projectId) {
        if (projectId == null) return;
        Instant now = Instant.now();
        evictIfNeeded(now);

        int maxPerHour = resolveMaxPerHour();
        if (maxPerHour > 0) {
            acquireSlot("project:" + projectId, maxPerHour, PROJECT_WINDOW_SECONDS, now,
                    "Dự án đã đạt giới hạn gửi lời mời trong giờ (tối đa " + maxPerHour + " lời mời/giờ). Vui lòng thử lại sau.");
        }
    }

    /**
     * Kiểm tra đồng thời cả hạn mức người dùng và hạn mức dự án (không làm tăng bộ đếm user nếu project đã đầy).
     */
    public synchronized void checkAndRecord(Long inviterId, Long projectId) {
        Instant now = Instant.now();
        evictIfNeeded(now);

        int maxPerMinute = resolveMaxPerMinute();
        int maxPerHour = resolveMaxPerHour();

        if (inviterId != null && maxPerMinute > 0 && isLimitReached("user:" + inviterId, maxPerMinute, now)) {
            throw new BusinessException(ErrorCode.TOO_MANY_REQUESTS,
                    "Bạn đang gửi lời mời quá nhanh (tối đa " + maxPerMinute + " lời mời/phút). Vui lòng đợi ít phút rồi thử lại.");
        }
        if (projectId != null && maxPerHour > 0 && isLimitReached("project:" + projectId, maxPerHour, now)) {
            throw new BusinessException(ErrorCode.TOO_MANY_REQUESTS,
                    "Dự án đã đạt giới hạn gửi lời mời trong giờ (tối đa " + maxPerHour + " lời mời/giờ). Vui lòng thử lại sau.");
        }

        if (inviterId != null && maxPerMinute > 0) {
            incrementSlot("user:" + inviterId, USER_WINDOW_SECONDS, now);
        }
        if (projectId != null && maxPerHour > 0) {
            incrementSlot("project:" + projectId, PROJECT_WINDOW_SECONDS, now);
        }
    }

    private int resolveMaxPerMinute() {
        return appProperties != null && appProperties.getInvitation() != null
                ? appProperties.getInvitation().getMaxPerMinutePerUser()
                : 10;
    }

    private int resolveMaxPerHour() {
        return appProperties != null && appProperties.getInvitation() != null
                ? appProperties.getInvitation().getMaxPerHourPerProject()
                : 30;
    }

    private boolean isLimitReached(String key, int limit, Instant now) {
        WindowBucket existing = buckets.get(key);
        return existing != null && !existing.isExpired(now) && existing.count >= limit;
    }

    private void incrementSlot(String key, long windowSeconds, Instant now) {
        buckets.compute(key, (k, existing) -> {
            WindowBucket bucket = (existing == null || existing.isExpired(now))
                    ? new WindowBucket(now, windowSeconds)
                    : existing;
            bucket.count++;
            return bucket;
        });
    }

    private void acquireSlot(String key, int limit, long windowSeconds, Instant now, String errorMessage) {
        boolean[] exceeded = {false};
        buckets.compute(key, (k, existing) -> {
            WindowBucket bucket = (existing == null || existing.isExpired(now))
                    ? new WindowBucket(now, windowSeconds)
                    : existing;
            if (bucket.count >= limit) {
                exceeded[0] = true;
                return bucket;
            }
            bucket.count++;
            return bucket;
        });

        if (exceeded[0]) {
            throw new BusinessException(ErrorCode.TOO_MANY_REQUESTS, errorMessage);
        }
    }

    private void evictIfNeeded(Instant now) {
        if (buckets.size() < EVICT_THRESHOLD) {
            return;
        }
        buckets.entrySet().removeIf(entry -> entry.getValue().isExpired(now));
        if (buckets.size() >= MAX_BUCKETS) {
            buckets.clear();
        }
    }

    /**
     * Xóa toàn bộ bộ đếm hiện tại (phục vụ kiểm thử đơn vị).
     */
    public void reset() {
        buckets.clear();
    }
}
