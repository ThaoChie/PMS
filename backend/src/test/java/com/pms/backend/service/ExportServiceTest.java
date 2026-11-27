package com.pms.backend.service;

import com.pms.backend.dto.MemberProductivityDto;
import com.pms.backend.dto.ProductivityFilterRequest;
import com.pms.backend.dto.ProductivityReportResponse;
import com.pms.backend.enu.ErrorCode;
import com.pms.backend.enu.WorkloadLevel;
import com.pms.backend.exception.BusinessException;
import com.pms.backend.model.Issue;
import com.pms.backend.model.Project;
import com.pms.backend.model.User;
import com.pms.backend.model.Worklog;
import com.pms.backend.service.impl.ExportServiceImpl;
import org.apache.poi.ss.usermodel.Font;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.usermodel.Workbook;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import java.io.ByteArrayInputStream;
import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Collections;
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

    @Test
    public void testExport_Excel_Success() throws Exception {
        Issue issue = new Issue();
        issue.setIssueKey("EXCEL-1");
        issue.setSummary("Test Excel Generation");
        issue.setType(com.pms.backend.enu.IssueType.TASK);
        issue.setPriority(com.pms.backend.enu.Priority.HIGH);

        byte[] xlsxBytes = exportService.generateExcel(List.of(issue));
        assertNotNull(xlsxBytes);
        assertTrue(xlsxBytes.length > 0);

        try (Workbook wb = new XSSFWorkbook(new ByteArrayInputStream(xlsxBytes))) {
            Sheet sheet = wb.getSheet("Issues");
            assertNotNull(sheet);

            // Row heights
            assertEquals(28.0f, sheet.getRow(0).getHeightInPoints(), 0.1);
            assertEquals(24.0f, sheet.getRow(1).getHeightInPoints(), 0.1);

            // Times New Roman Font
            Font headerFont = wb.getFontAt(sheet.getRow(0).getCell(0).getCellStyle().getFontIndex());
            assertEquals("Times New Roman", headerFont.getFontName());

            Font dataFont = wb.getFontAt(sheet.getRow(1).getCell(0).getCellStyle().getFontIndex());
            assertEquals("Times New Roman", dataFont.getFontName());

            // Column width padding applied
            for (int i = 0; i < 13; i++) {
                assertTrue(sheet.getColumnWidth(i) >= 12 * 256);
            }
        }
    }

    @Test
    public void testExportProductivityExcel_Generates4Sheets_WithProperContent() throws Exception {
        Project project = new Project();
        project.setId(1L);
        project.setName("Project Alpha");
        project.setProjectKey("ALPHA");

        ProductivityFilterRequest filter = new ProductivityFilterRequest();
        filter.setFrom(LocalDate.of(2026, 10, 1));
        filter.setTo(LocalDate.of(2026, 10, 31));
        filter.setRoles(List.of("DEVELOPER"));

        MemberProductivityDto member = new MemberProductivityDto();
        member.setUserId(10L);
        member.setFullName("Nguyen Van A");
        member.setEmail("a@pms.com");
        member.setProjectRole("DEVELOPER");
        member.setAssignedIssues(5);
        member.setCompletedIssues(4);
        member.setInProgressIssues(1);
        member.setTodoIssues(0);
        member.setOnTimeRate(100.0);
        member.setOverdueIssues(0);
        member.setEstimatedHours(20.0);
        member.setTotalLoggedHours(18.0);
        member.setVariancePercentage(-10.0);
        member.setAvgResolutionTimeHours(12.5);
        member.setBugsAssigned(1);
        member.setBugsResolved(1);
        member.setBugsReopened(0);
        member.setWorkloadLevel(WorkloadLevel.BALANCED);

        ProductivityReportResponse report = new ProductivityReportResponse();
        report.setProjectId(1L);
        report.setFrom(filter.getFrom());
        report.setTo(filter.getTo());
        report.setTotalAssigned(5);
        report.setTotalCompleted(4);
        report.setTotalInProgress(1);
        report.setTotalTodo(0);
        report.setTotalOverdue(0);
        report.setOverallOnTimeRate(100.0);
        report.setTotalEstimatedHours(20.0);
        report.setTotalLoggedHours(18.0);
        report.setAvgResolutionTimeHours(12.5);
        report.setTotalBugsAssigned(1);
        report.setTotalBugsResolved(1);
        report.setTotalBugsReopened(0);
        report.setMembers(List.of(member));

        Issue issue = new Issue();
        issue.setIssueKey("ALPHA-1");
        issue.setSummary("Implement Feature");
        issue.setType(com.pms.backend.enu.IssueType.TASK);
        issue.setPriority(com.pms.backend.enu.Priority.HIGH);
        issue.setOriginalEstimateMin(300);
        issue.setTimeSpentMin(240);

        Worklog worklog = new Worklog();
        worklog.setIssue(issue);
        User u = new User();
        u.setFullName("Nguyen Van A");
        u.setEmail("a@pms.com");
        worklog.setUser(u);
        worklog.setWorkDate(LocalDate.of(2026, 10, 15));
        worklog.setTimeSpentMin(240);
        worklog.setComment("Worked on task");

        User currentUser = new User();
        currentUser.setFullName("PM User");
        currentUser.setEmail("pm@pms.com");

        byte[] excelBytes = exportService.generateProductivityExcel(
                project, report, List.of(issue), List.of(worklog), filter, currentUser
        );

        assertNotNull(excelBytes);
        assertTrue(excelBytes.length > 0);

        // Verify Excel structure
        try (Workbook wb = new XSSFWorkbook(new ByteArrayInputStream(excelBytes))) {
            assertEquals(4, wb.getNumberOfSheets());
            Sheet sheet1 = wb.getSheetAt(0);
            Sheet sheet2 = wb.getSheetAt(1);
            Sheet sheet3 = wb.getSheetAt(2);
            Sheet sheet4 = wb.getSheetAt(3);

            assertEquals("Tổng quan", sheet1.getSheetName());
            assertEquals("Theo thành viên", sheet2.getSheetName());
            assertEquals("Chi tiết Issue", sheet3.getSheetName());
            assertEquals("Log thời gian", sheet4.getSheetName());

            // Check metadata in sheet 1
            assertTrue(sheet1.getRow(0).getCell(0).getStringCellValue().contains("BÁO CÁO NĂNG SUẤT"));
            assertTrue(sheet1.getRow(2).getCell(1).getStringCellValue().contains("Project Alpha"));
            assertEquals(36.0f, sheet1.getRow(0).getHeightInPoints(), 0.1);
            Font titleFont = wb.getFontAt(sheet1.getRow(0).getCell(0).getCellStyle().getFontIndex());
            assertEquals("Times New Roman", titleFont.getFontName());

            // Check member in sheet 2
            assertEquals("Nguyen Van A", sheet2.getRow(1).getCell(0).getStringCellValue());
            assertEquals("DEVELOPER", sheet2.getRow(1).getCell(2).getStringCellValue());
            assertEquals(5.0, sheet2.getRow(1).getCell(3).getNumericCellValue());
            assertEquals(28.0f, sheet2.getRow(0).getHeightInPoints(), 0.1);
            assertEquals(24.0f, sheet2.getRow(1).getHeightInPoints(), 0.1);
            Font s2HeaderFont = wb.getFontAt(sheet2.getRow(0).getCell(0).getCellStyle().getFontIndex());
            assertEquals("Times New Roman", s2HeaderFont.getFontName());
            Font s2DataFont = wb.getFontAt(sheet2.getRow(1).getCell(0).getCellStyle().getFontIndex());
            assertEquals("Times New Roman", s2DataFont.getFontName());

            // Check column widths in sheet 2
            for (int i = 0; i < 17; i++) {
                assertTrue(sheet2.getColumnWidth(i) >= 14 * 256);
            }

            // Check issue in sheet 3
            assertEquals("ALPHA-1", sheet3.getRow(1).getCell(0).getStringCellValue());
            assertEquals(28.0f, sheet3.getRow(0).getHeightInPoints(), 0.1);
            assertEquals(24.0f, sheet3.getRow(1).getHeightInPoints(), 0.1);

            // Check worklog in sheet 4
            assertEquals("ALPHA-1", sheet4.getRow(1).getCell(0).getStringCellValue());
            assertEquals("Nguyen Van A", sheet4.getRow(1).getCell(2).getStringCellValue());
            assertEquals(28.0f, sheet4.getRow(0).getHeightInPoints(), 0.1);
            assertEquals(24.0f, sheet4.getRow(1).getHeightInPoints(), 0.1);
        }
    }

    @Test
    public void testExportProductivityExcel_FormulaInjectionEscape() throws Exception {
        Project project = new Project();
        project.setProjectKey("SAFE");
        project.setName("=cmd|' /C calc'!A0");

        MemberProductivityDto member = new MemberProductivityDto();
        member.setFullName("@InjectedUser");
        member.setEmail("+hack@pms.com");
        member.setProjectRole("-ADMIN");

        ProductivityReportResponse report = new ProductivityReportResponse();
        report.setMembers(List.of(member));

        Issue issue = new Issue();
        issue.setIssueKey("=KEY-1");
        issue.setSummary("+MaliciousFormula");

        Worklog worklog = new Worklog();
        worklog.setIssue(issue);
        worklog.setComment("-ExploitComment");

        byte[] excelBytes = exportService.generateProductivityExcel(
                project, report, List.of(issue), List.of(worklog), new ProductivityFilterRequest(), null
        );

        assertNotNull(excelBytes);
        try (Workbook wb = new XSSFWorkbook(new ByteArrayInputStream(excelBytes))) {
            Sheet sheet1 = wb.getSheet("Tổng quan");
            assertTrue(sheet1.getRow(2).getCell(1).getStringCellValue().startsWith("'="));

            Sheet sheet2 = wb.getSheet("Theo thành viên");
            assertTrue(sheet2.getRow(1).getCell(0).getStringCellValue().startsWith("'@"));
            assertTrue(sheet2.getRow(1).getCell(1).getStringCellValue().startsWith("'+"));
            assertTrue(sheet2.getRow(1).getCell(2).getStringCellValue().startsWith("'-"));

            Sheet sheet3 = wb.getSheet("Chi tiết Issue");
            assertTrue(sheet3.getRow(1).getCell(0).getStringCellValue().startsWith("'="));
            assertTrue(sheet3.getRow(1).getCell(1).getStringCellValue().startsWith("'+"));

            Sheet sheet4 = wb.getSheet("Log thời gian");
            assertTrue(sheet4.getRow(1).getCell(7).getStringCellValue().startsWith("'-"));
        }
    }

    @Test
    public void testExportProductivityExcel_ExceedsLimit_ThrowsException() {
        ReflectionTestUtils.setField(exportService, "maxExportRows", 5);

        List<Issue> issues = new ArrayList<>();
        for (int i = 0; i < 6; i++) {
            issues.add(new Issue());
        }

        BusinessException ex = assertThrows(BusinessException.class, () -> {
            exportService.generateProductivityExcel(
                    new Project(), new ProductivityReportResponse(), issues, Collections.emptyList(), new ProductivityFilterRequest(), null
            );
        });
        assertEquals(ErrorCode.EXPORT_LIMIT_EXCEEDED, ex.getErrorCode());
    }

    @Test
    public void testGenerateProductivityCsv_Success() {
        Project project = new Project();
        project.setId(1L);
        project.setName("Alpha");
        project.setProjectKey("ALP");

        ProductivityReportResponse report = new ProductivityReportResponse();
        report.setFrom(LocalDate.of(2026, 1, 1));
        report.setTo(LocalDate.of(2026, 1, 31));
        report.setTotalAssigned(10);
        report.setTotalCompleted(8);

        MemberProductivityDto m = new MemberProductivityDto();
        m.setFullName("Nguyen Van A");
        m.setEmail("a@example.com");
        m.setProjectRole("DEVELOPER");
        m.setAssignedIssues(10);
        m.setCompletedIssues(8);
        m.setOnTimeRate(80.0);
        report.setMembers(List.of(m));

        Issue issue = new Issue();
        issue.setIssueKey("ALP-1");
        issue.setSummary("Fix bug");

        Worklog worklog = new Worklog();
        worklog.setIssue(issue);
        worklog.setTimeSpentMin(120);

        byte[] csvBytes = exportService.generateProductivityCsv(
                project, report, List.of(issue), List.of(worklog), new ProductivityFilterRequest(), null
        );

        assertNotNull(csvBytes);
        String csv = new String(csvBytes, StandardCharsets.UTF_8);
        assertTrue(csv.startsWith("\uFEFF"));
        assertTrue(csv.contains("BÁO CÁO NĂNG SUẤT DỰ ÁN"));
        assertTrue(csv.contains("Alpha (ALP)"));
        assertTrue(csv.contains("CHỈ SỐ TỔNG HỢP"));
        assertTrue(csv.contains("NĂNG SUẤT THEO THÀNH VIÊN"));
        assertTrue(csv.contains("Nguyen Van A"));
        assertTrue(csv.contains("CHI TIẾT CÔNG VIỆC"));
        assertTrue(csv.contains("ALP-1"));
        assertTrue(csv.contains("LOG THỜI GIAN"));
    }

    @Test
    public void testGenerateProductivityCsv_SanitizesFormulaInjection() {
        Project project = new Project();
        project.setName("=cmd|' /C calc'!A0");
        project.setProjectKey("MAL");

        Issue issue = new Issue();
        issue.setIssueKey("MAL-1");
        issue.setSummary("+12345");

        byte[] csvBytes = exportService.generateProductivityCsv(
                project, new ProductivityReportResponse(), List.of(issue), Collections.emptyList(), new ProductivityFilterRequest(), null
        );

        String csv = new String(csvBytes, StandardCharsets.UTF_8);
        assertTrue(csv.contains("''=cmd|' /C calc'!A0") || csv.contains("=\"'=cmd") || csv.contains("'=cmd"));
        assertTrue(csv.contains("'+12345"));
    }

    @Test
    public void testGenerateProductivityCsv_ExceedsLimit_ThrowsException() {
        ReflectionTestUtils.setField(exportService, "maxExportRows", 5);

        List<Issue> issues = new ArrayList<>();
        for (int i = 0; i < 6; i++) {
            issues.add(new Issue());
        }

        BusinessException ex = assertThrows(BusinessException.class, () -> {
            exportService.generateProductivityCsv(
                    new Project(), new ProductivityReportResponse(), issues, Collections.emptyList(), new ProductivityFilterRequest(), null
            );
        });
        assertEquals(ErrorCode.EXPORT_LIMIT_EXCEEDED, ex.getErrorCode());
    }
}
