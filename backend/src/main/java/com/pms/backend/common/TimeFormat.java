package com.pms.backend.common;

import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;

/**
 * Định dạng thời điểm gửi ra API KÈM MÚI GIỜ.
 *
 * Entity lưu LocalDateTime theo giờ của máy chủ. Máy chủ Render chạy UTC, nên chuỗi không múi giờ
 * như "2026-11-25T03:00:00" bị trình duyệt ở Việt Nam hiểu là 03:00 giờ VN -> lệch 7 tiếng
 * ("7 giờ trước" cho việc vừa xảy ra). Gắn múi giờ của máy chủ vào chuỗi
 * ("2026-11-25T03:00:00Z" hoặc "...+07:00") thì mọi trình duyệt đều tính đúng.
 */
public final class TimeFormat {

    private TimeFormat() {}

    /** "2026-11-25T10:00:00.123+07:00" (máy chủ giờ VN) hoặc "2026-11-25T03:00:00.123Z" (máy chủ UTC). */
    public static String isoWithZone(LocalDateTime time) {
        if (time == null) return null;
        return time.atZone(ZoneId.systemDefault()).toOffsetDateTime().format(DateTimeFormatter.ISO_OFFSET_DATE_TIME);
    }
}
