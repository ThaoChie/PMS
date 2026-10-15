package com.pms.backend.util;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

public class DurationParserTest {

    @Test
    public void testParseToMinutes_StandardFormats() {
        assertEquals(150, DurationParser.parseToMinutes("2h30m"));
        assertEquals(45, DurationParser.parseToMinutes("45m"));
        assertEquals(120, DurationParser.parseToMinutes("2h"));
        assertEquals(480, DurationParser.parseToMinutes("1d")); // 1d = 8h = 480m
        assertEquals(600, DurationParser.parseToMinutes("1d 2h")); // 480 + 120 = 600m
        assertEquals(630, DurationParser.parseToMinutes("1d 2h 30m"));
    }

    @Test
    public void testParseToMinutes_NumericString() {
        assertEquals(90, DurationParser.parseToMinutes("90"));
    }

    @Test
    public void testParseToMinutes_BlankOrNull() {
        assertEquals(0, DurationParser.parseToMinutes(null));
        assertEquals(0, DurationParser.parseToMinutes(""));
        assertEquals(0, DurationParser.parseToMinutes("   "));
    }

    @Test
    public void testFormatMinutes() {
        assertEquals("0m", DurationParser.formatMinutes(0));
        assertEquals("30m", DurationParser.formatMinutes(30));
        assertEquals("2h", DurationParser.formatMinutes(120));
        assertEquals("2h 30m", DurationParser.formatMinutes(150));
        assertEquals("1d", DurationParser.formatMinutes(480));
        assertEquals("1d 2h 30m", DurationParser.formatMinutes(630));
    }
}
