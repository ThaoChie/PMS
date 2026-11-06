package com.pms.backend.flowable;

import com.pms.backend.config.ApprovalProperties;
import com.pms.backend.config.TimeZoneAwareCycleBusinessCalendar;
import org.flowable.common.engine.impl.runtime.ClockReader;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Calendar;
import java.util.Date;
import java.util.TimeZone;

import static org.assertj.core.api.Assertions.assertThat;

class TimeZoneAwareCycleBusinessCalendarTest {

    @Test
    @DisplayName("3.1: Chứng minh tính đúng lần kích hoạt tiếp theo theo múi giờ Asia/Ho_Chi_Minh so với UTC")
    void testCalculateNextTrigger_AsiaHoChiMinh_vs_UTC() {
        // Giả lập đồng hồ đang ở: 2026-11-06 00:00:00 UTC (tương đương 07:00:00 sáng ở Việt Nam UTC+7)
        Calendar fixedCalUtc = Calendar.getInstance(TimeZone.getTimeZone("UTC"));
        fixedCalUtc.set(2026, Calendar.NOVEMBER, 6, 0, 0, 0);
        fixedCalUtc.set(Calendar.MILLISECOND, 0);
        Date clockTime = fixedCalUtc.getTime();

        ClockReader mockClockReader = new ClockReader() {
            @Override
            public Date getCurrentTime() {
                return clockTime;
            }

            @Override
            public TimeZone getCurrentTimeZone() {
                return TimeZone.getTimeZone("UTC");
            }

            @Override
            public Calendar getCurrentCalendar() {
                return Calendar.getInstance(getCurrentTimeZone());
            }

            @Override
            public Calendar getCurrentCalendar(TimeZone timeZone) {
                return Calendar.getInstance(timeZone);
            }
        };

        // Cron hàng ngày lúc 08:00:00 AM
        String cron = "0 0 8 * * ?";

        // 1. Calendar với múi giờ Asia/Ho_Chi_Minh
        TimeZone vnTimeZone = TimeZone.getTimeZone("Asia/Ho_Chi_Minh");
        TimeZoneAwareCycleBusinessCalendar vnCalendar = new TimeZoneAwareCycleBusinessCalendar(mockClockReader, vnTimeZone);
        Date nextVnTrigger = vnCalendar.resolveDuedate(cron, 0);

        // 2. Calendar với múi giờ UTC mặc định
        TimeZone utcTimeZone = TimeZone.getTimeZone("UTC");
        TimeZoneAwareCycleBusinessCalendar utcCalendar = new TimeZoneAwareCycleBusinessCalendar(mockClockReader, utcTimeZone);
        Date nextUtcTrigger = utcCalendar.resolveDuedate(cron, 0);

        // Kiểm chứng:
        // - Tại 00:00 UTC (07:00 VN), 8h sáng VN sẽ đến sau đúng 1 tiếng (01:00 UTC cùng ngày).
        // - Trong khi đó 8h sáng UTC sẽ phải chờ 8 tiếng (08:00 UTC cùng ngày).
        Instant expectedVnTriggerUtc = clockTime.toInstant().plus(1, ChronoUnit.HOURS);
        Instant expectedUtcTriggerUtc = clockTime.toInstant().plus(8, ChronoUnit.HOURS);

        assertThat(nextVnTrigger.toInstant()).isEqualTo(expectedVnTriggerUtc);
        assertThat(nextUtcTrigger.toInstant()).isEqualTo(expectedUtcTriggerUtc);
        assertThat(nextVnTrigger).isBefore(nextUtcTrigger);
    }

    @Test
    @DisplayName("3.2: Cron và múi giờ đọc chính xác từ cấu hình ApprovalProperties")
    void testCronFromApprovalProperties() {
        ApprovalProperties properties = new ApprovalProperties();
        properties.setDueDateReminderCron("0 30 9 * * ?");
        properties.setTimeZone("Asia/Ho_Chi_Minh");

        assertThat(properties.getDueDateReminderCron()).isEqualTo("0 30 9 * * ?");
        assertThat(properties.getTimeZone()).isEqualTo("Asia/Ho_Chi_Minh");

        // Giả lập 01:00:00 UTC (08:00:00 VN)
        Calendar cal = Calendar.getInstance(TimeZone.getTimeZone("UTC"));
        cal.set(2026, Calendar.NOVEMBER, 6, 1, 0, 0);
        cal.set(Calendar.MILLISECOND, 0);
        Date clockTime = cal.getTime();

        ClockReader clock = new ClockReader() {
            @Override
            public Date getCurrentTime() { return clockTime; }
            @Override
            public TimeZone getCurrentTimeZone() { return TimeZone.getTimeZone("UTC"); }
            @Override
            public Calendar getCurrentCalendar() { return Calendar.getInstance(getCurrentTimeZone()); }
            @Override
            public Calendar getCurrentCalendar(TimeZone tz) { return Calendar.getInstance(tz); }
        };

        TimeZoneAwareCycleBusinessCalendar calendar = new TimeZoneAwareCycleBusinessCalendar(
                clock, TimeZone.getTimeZone(properties.getTimeZone()));

        Date nextTrigger = calendar.resolveDuedate(properties.getDueDateReminderCron(), 0);

        // 09:30 VN = 02:30 UTC (sau đúng 1 tiếng 30 phút = 90 phút)
        Instant expectedTrigger = clockTime.toInstant().plus(90, ChronoUnit.MINUTES);
        assertThat(nextTrigger.toInstant()).isEqualTo(expectedTrigger);
    }
}
