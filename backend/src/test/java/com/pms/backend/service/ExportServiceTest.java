package com.pms.backend.service;

import com.pms.backend.service.impl.*;
import com.pms.backend.service.interfaces.*;

import com.pms.backend.enu.ErrorCode;
import com.pms.backend.exception.BusinessException;
import com.pms.backend.model.Issue;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

public class ExportServiceTest {

    private ExportServiceImpl exportService;

    @BeforeEach
    public void setup() {
        exportService = new ExportServiceImpl();
        ReflectionTestUtils.setField(exportService, "maxExportRows", 100);
    }

    @Test
    public void testExport_ExceedsLimit_ThrowsException() {
        List<Issue> issues = new ArrayList<>();
        for (int i = 0; i < 101; i++) {
            issues.add(new Issue());
        }

        BusinessException ex = assertThrows(BusinessException.class, () -> {
            exportService.exportToCsv(issues);
        });

        assertEquals(ErrorCode.EXPORT_LIMIT_EXCEEDED, ex.getErrorCode());
    }

    @Test
    public void testExport_WithinLimit_Success() {
        List<Issue> issues = new ArrayList<>();
        for (int i = 0; i < 100; i++) {
            issues.add(new Issue());
        }

        byte[] csvBytes = exportService.exportToCsv(issues);
        assertNotNull(csvBytes);
        assertTrue(csvBytes.length > 0);
    }

    @Test
    public void testExport_CsvInjectionProtection() {
        // Cells starting with =, +, -, @ must be prefixed with '
        assertEquals("'=1+2", ExportServiceImpl.sanitizeForSpreadsheet("=1+2"));
        assertEquals("'+SUM(A1:A5)", ExportServiceImpl.sanitizeForSpreadsheet("+SUM(A1:A5)"));
        assertEquals("'-5+10", ExportServiceImpl.sanitizeForSpreadsheet("-5+10"));
        assertEquals("'@evil", ExportServiceImpl.sanitizeForSpreadsheet("@evil"));
        assertEquals("Safe text", ExportServiceImpl.sanitizeForSpreadsheet("Safe text"));
        assertEquals("", ExportServiceImpl.sanitizeForSpreadsheet(""));
        assertEquals("", ExportServiceImpl.sanitizeForSpreadsheet(null));

        Issue issue = new Issue();
        issue.setIssueKey("TEST-1");
        issue.setSummary("=cmd|' /C calc'!A0");

        byte[] csvBytes = exportService.exportToCsv(List.of(issue));
        String csvContent = new String(csvBytes, StandardCharsets.UTF_8);

        // Verify BOM is present
        assertTrue(csvContent.startsWith("\uFEFF"));
        // Verify formula was neutralized
        assertTrue(csvContent.contains("'=cmd|' /C calc'!A0"));
    }
}
