package com.pms.backend.util;

import java.util.regex.Matcher;
import java.util.regex.Pattern;

public final class DurationParser {

    private static final Pattern DURATION_PATTERN = Pattern.compile("(?:(\\d+)\\s*d)?\\s*(?:(\\d+)\\s*h)?\\s*(?:(\\d+)\\s*m)?", Pattern.CASE_INSENSITIVE);
    private static final int MINUTES_PER_HOUR = 60;
    private static final int MINUTES_PER_DAY = 8 * MINUTES_PER_HOUR; // 8h standard workday

    private DurationParser() {}

    /**
     * Parses a duration string like "2h30m", "1d 2h", "45m", "120" (plain minutes) into integer minutes.
     */
    public static Integer parseToMinutes(String input) {
        if (input == null || input.isBlank()) {
            return 0;
        }

        String trimmed = input.trim();

        // If purely digits, treat as minutes
        if (trimmed.matches("^\\d+$")) {
            return Integer.parseInt(trimmed);
        }

        Matcher matcher = DURATION_PATTERN.matcher(trimmed);
        if (!matcher.matches()) {
            return 0;
        }

        int totalMinutes = 0;
        String days = matcher.group(1);
        String hours = matcher.group(2);
        String minutes = matcher.group(3);

        if (days != null) {
            totalMinutes += Integer.parseInt(days) * MINUTES_PER_DAY;
        }
        if (hours != null) {
            totalMinutes += Integer.parseInt(hours) * MINUTES_PER_HOUR;
        }
        if (minutes != null) {
            totalMinutes += Integer.parseInt(minutes);
        }

        return totalMinutes;
    }

    /**
     * Formats integer minutes into human-readable string like "2h 30m" or "1d 2h".
     */
    public static String formatMinutes(Integer minutes) {
        if (minutes == null || minutes <= 0) {
            return "0m";
        }

        int days = minutes / MINUTES_PER_DAY;
        int remaining = minutes % MINUTES_PER_DAY;
        int hours = remaining / MINUTES_PER_HOUR;
        int mins = remaining % MINUTES_PER_HOUR;

        StringBuilder sb = new StringBuilder();
        if (days > 0) {
            sb.append(days).append("d ");
        }
        if (hours > 0) {
            sb.append(hours).append("h ");
        }
        if (mins > 0 || sb.isEmpty()) {
            sb.append(mins).append("m");
        }

        return sb.toString().trim();
    }
}
