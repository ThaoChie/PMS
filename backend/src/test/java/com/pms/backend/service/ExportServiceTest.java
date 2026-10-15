package com.pms.backend.service;

import com.pms.backend.exception.BusinessException;
import com.pms.backend.model.Issue;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.ArrayList;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertThrows;

public class ExportServiceTest {

    private ExportService exportService;

    @BeforeEach
    public void setup() {
        exportService = new ExportService();
        ReflectionTestUtils.setField(exportService, "maxExportRows", 100);
    }

    @Test
    public void testExport_ExceedsLimit_ThrowsException() {
        List<Issue> issues = new ArrayList<>();
        for (int i = 0; i < 101; i++) {
            issues.add(new Issue());
        }

        assertThrows(BusinessException.class, () -> {
            exportService.exportToCsv(issues);
        });
    }

    @Test
    public void testExport_WithinLimit_Success() {
        List<Issue> issues = new ArrayList<>();
        for (int i = 0; i < 100; i++) {
            issues.add(new Issue());
        }

        exportService.exportToCsv(issues); // Should not throw exception
    }
}
