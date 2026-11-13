package com.pms.backend.util;

import java.util.regex.Matcher;
import java.util.regex.Pattern;

public final class DurationParser {

    private static final int MINUTES_PER_HOUR = 60;
    private static final int MINUTES_PER_DAY = 8 * MINUTES_PER_HOUR; // 8h standard workday

    // Pattern matching components with optional decimals: e.g. 1.5d, 2.5h, 30m, 1h 30m
    private static final Pattern COMPONENT_PATTERN = Pattern.compile(
            "(\\d+(?:[.,]\\d+)?)\\s*(d(?:ays?)?|ngày|h(?:(?:ou)?rs?)?|tiếng|giờ|m(?:in(?:ute)?s?)?|phút)?",
            Pattern.CASE_INSENSITIVE
    );

    private DurationParser() {}

    /**
     * Parses a duration string like "2h30m", "1d 2h", "1.5h", "45m", "120" (plain minutes) into integer minutes.
     */
    public static Integer parseToMinutes(String input) {
        if (input == null || input.isBlank()) {
            return 0;
        }

        String trimmed = input.trim().toLowerCase();

        // If purely digits, treat as minutes
        if (trimmed.matches("^\\d+$")) {
            return Integer.parseInt(trimmed);
        }

        // If decimal without unit (e.g. "1.5" or "2,5"), treat as hours
        if (trimmed.matches("^\\d+[.,]\\d+$")) {
            double hrs = Double.parseDouble(trimmed.replace(',', '.'));
            return (int) Math.round(hrs * MINUTES_PER_HOUR);
        }

        Matcher matcher = COMPONENT_PATTERN.matcher(trimmed);
        double totalMinutes = 0;
        boolean foundAny = false;

        while (matcher.find()) {
            String valueStr = matcher.group(1);
            String unit = matcher.group(2);

            if (valueStr == null || valueStr.isBlank()) {
                continue;
            }

            double val = Double.parseDouble(valueStr.replace(',', '.'));

            if (unit == null || unit.isBlank()) {
                // Default to hours if value < 8, otherwise minutes
                if (val <= 8) {
                    totalMinutes += val * MINUTES_PER_HOUR;
                } else {
                    totalMinutes += val;
                }
                foundAny = true;
            } else {
                char u = unit.charAt(0);
                if (u == 'd' || unit.equals("ngày")) {
                    totalMinutes += val * MINUTES_PER_DAY;
                    foundAny = true;
                } else if (u == 'h' || unit.equals("tiếng") || unit.equals("giờ")) {
                    totalMinutes += val * MINUTES_PER_HOUR;
                    foundAny = true;
                } else if (u == 'm' || unit.equals("phút")) {
                    totalMinutes += val;
                    foundAny = true;
                }
            }
        }

        if (!foundAny) {
            return 0;
        }

        return (int) Math.round(totalMinutes);
    }

    /**
     * Formats integer minutes into human-readable string like "2h 30m" or "1d 2h".
     */
    public static String formatMinutes(Integer minutes) {
        if (minutes == null || minutes <= 0) {
            return "0m";
        }

        int days = minutes / MINUTES_PER_DAY;
        int remainingAfterDays = minutes % MINUTES_PER_DAY;
        int hours = remainingAfterDays / MINUTES_PER_HOUR;
        int mins = remainingAfterDays % MINUTES_PER_HOUR;

        StringBuilder sb = new StringBuilder();
        if (days > 0) {
            sb.append(days).append("d");
        }
        if (hours > 0) {
            if (sb.length() > 0) sb.append(" ");
            sb.append(hours).append("h");
        }
        if (mins > 0 || sb.length() == 0) {
            if (sb.length() > 0) sb.append(" ");
            sb.append(mins).append("m");
        }

        return sb.toString();
    }
}
