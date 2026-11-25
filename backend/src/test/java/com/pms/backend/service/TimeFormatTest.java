package com.pms.backend.service;

import com.pms.backend.common.TimeFormat;
import org.junit.jupiter.api.Test;

import java.time.LocalDateTime;
import java.time.OffsetDateTime;
import java.time.ZoneId;
import java.util.TimeZone;

import static org.junit.jupiter.api.Assertions.*;

/** Thời điểm gửi ra API (hoạt động gần đây, bình luận, ghi nhận thời gian) phải kèm múi giờ. */
class TimeFormatTest {

    @Test
    void mayChuUtc_ghiKyHieuZ_trinhDuyetVnTinhDung() {
        TimeZone saved = TimeZone.getDefault();
        try {
            TimeZone.setDefault(TimeZone.getTimeZone("UTC")); // giống máy chủ Render
            String s = TimeFormat.isoWithZone(LocalDateTime.of(2026, 11, 25, 3, 0, 0));
            assertTrue(s.endsWith("Z") || s.endsWith("+00:00"), "phai kem mui gio UTC: " + s);
            // 03:00 UTC = 10:00 giờ Việt Nam, không phải 03:00 giờ Việt Nam
            assertEquals(LocalDateTime.of(2026, 11, 25, 10, 0, 0),
                    OffsetDateTime.parse(s).atZoneSameInstant(ZoneId.of("Asia/Ho_Chi_Minh")).toLocalDateTime());
        } finally {
            TimeZone.setDefault(saved);
        }
    }

    @Test
    void mayChuGioVn_ghiCong7() {
        TimeZone saved = TimeZone.getDefault();
        try {
            TimeZone.setDefault(TimeZone.getTimeZone("Asia/Ho_Chi_Minh"));
            assertTrue(TimeFormat.isoWithZone(LocalDateTime.of(2026, 11, 25, 10, 0)).endsWith("+07:00"));
        } finally {
            TimeZone.setDefault(saved);
        }
    }

    @Test
    void null_traVeNull() {
        assertNull(TimeFormat.isoWithZone(null));
    }
}
