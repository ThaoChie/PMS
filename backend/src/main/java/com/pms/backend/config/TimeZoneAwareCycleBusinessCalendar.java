package com.pms.backend.config;

import org.flowable.common.engine.api.FlowableException;
import org.flowable.common.engine.impl.calendar.CronExpression;
import org.flowable.common.engine.impl.calendar.CycleBusinessCalendar;
import org.flowable.common.engine.impl.runtime.ClockReader;

import java.util.Date;
import java.util.TimeZone;

/**
 * Calendar hỗ trợ thiết lập múi giờ cho timer cycle (vd: Asia/Ho_Chi_Minh)
 * thay vì phụ thuộc vào múi giờ mặc định của JVM container/OS.
 */
public class TimeZoneAwareCycleBusinessCalendar extends CycleBusinessCalendar {

    private final TimeZone timeZone;

    public TimeZoneAwareCycleBusinessCalendar(ClockReader clockReader, TimeZone timeZone) {
        super(clockReader);
        this.timeZone = timeZone;
    }

    @Override
    public Date resolveDuedate(String duedateDescription, int maxIterations) {
        if (duedateDescription != null && duedateDescription.startsWith("R")) {
            return super.resolveDuedate(duedateDescription, maxIterations);
        }
        try {
            CronExpression cronExpression = new CronExpression(duedateDescription, clockReader);
            if (timeZone != null) {
                cronExpression.setTimeZone(timeZone);
            }
            return cronExpression.getTimeAfter(clockReader.getCurrentTime());
        } catch (Exception e) {
            throw new FlowableException("Failed to parse and calculate timer cron: " + duedateDescription, e);
        }
    }
}
