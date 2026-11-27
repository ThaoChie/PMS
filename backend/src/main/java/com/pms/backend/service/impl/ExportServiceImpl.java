package com.pms.backend.service.impl;

import com.pms.backend.service.interfaces.*;

import com.pms.backend.dto.IssueSearchRequest;
import com.pms.backend.dto.MemberProductivityDto;
import com.pms.backend.dto.ProductivityFilterRequest;
import com.pms.backend.dto.ProductivityReportResponse;
import com.pms.backend.enu.ErrorCode;
import com.pms.backend.exception.BusinessException;
import com.pms.backend.hibernateDao.IssueSearchDao;
import com.pms.backend.model.Issue;
import com.pms.backend.model.Project;
import com.pms.backend.model.User;
import com.pms.backend.model.Worklog;
import com.pms.backend.util.DurationParser;
import com.pms.backend.util.ExcelStyleHelper;
import org.apache.poi.ss.usermodel.Cell;
import org.apache.poi.ss.usermodel.CellStyle;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.usermodel.Workbook;
import org.apache.poi.ss.util.CellRangeAddress;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.apache.poi.xssf.streaming.SXSSFWorkbook;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.time.format.DateTimeFormatter;
import java.util.List;

@Service
@Transactional(readOnly = true)
public class ExportServiceImpl implements IExportService {

    private static final Logger log = LoggerFactory.getLogger(ExportServiceImpl.class);

    @Value("${app.export.max-rows:10000}")
    private int maxExportRows = 10000;

    private final IssueSearchDao issueSearchDao;

    public ExportServiceImpl() {
        this.issueSearchDao = null;
    }

    @Autowired
    public ExportServiceImpl(IssueSearchDao issueSearchDao) {
        this.issueSearchDao = issueSearchDao;
    }

    public static final String[] HEADERS = {
            "Mã công việc",
            "Tiêu đề",
            "Loại",
            "Trạng thái",
            "Người được gán",
            "Người báo cáo",
            "Mức độ ưu tiên",
            "Ngày hết hạn",
            "Ước tính gốc",
            "Còn lại",
            "Thời gian đã dành",
            "Ngày tạo",
            "Cập nhật lần cuối"
    };

    /**
     * Sanitizes string to prevent CSV / Excel formula injection (prepends ' if starts with =, +, -, @)
     */
    public static String sanitizeForSpreadsheet(String value) {
        if (value == null) return "";
        String trimmed = value.trim();
        if (!trimmed.isEmpty()) {
            char firstChar = trimmed.charAt(0);
            if (firstChar == '=' || firstChar == '+' || firstChar == '-' || firstChar == '@') {
                return "'" + value;
            }
        }
        return value;
    }

    public byte[] exportIssues(IssueSearchRequest request, String format, List<Long> accessibleProjectIds, Long currentUserId, List<Long> recentlyViewedIds) {
        if (issueSearchDao != null) {
            long totalCount = issueSearchDao.countIssues(request, accessibleProjectIds, currentUserId, recentlyViewedIds);
            if (totalCount > maxExportRows) {
                throw new BusinessException(
                        ErrorCode.EXPORT_LIMIT_EXCEEDED,
                        "Vượt quá giới hạn xuất dữ liệu (" + maxExportRows + " dòng). Vui lòng thu hẹp bộ lọc."
                );
            }
            List<Issue> issues = issueSearchDao.searchIssues(request, accessibleProjectIds, currentUserId, recentlyViewedIds);
            if ("csv".equalsIgnoreCase(format)) {
                return generateCsv(issues);
            } else {
                return generateExcel(issues);
            }
        }
        return new byte[0];
    }

    public byte[] generateCsv(List<Issue> issues) {
        if (issues.size() > maxExportRows) {
            throw new BusinessException(
                    ErrorCode.EXPORT_LIMIT_EXCEEDED,
                    "Vượt quá giới hạn xuất dữ liệu (" + maxExportRows + " dòng). Vui lòng thu hẹp bộ lọc."
            );
        }

        StringBuilder sb = new StringBuilder();
        // UTF-8 BOM
        sb.append('\uFEFF');

        // Headers
        for (int i = 0; i < HEADERS.length; i++) {
            sb.append(escapeCsvField(HEADERS[i]));
            if (i < HEADERS.length - 1) sb.append(",");
        }
        sb.append("\n");

        DateTimeFormatter dtf = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm");
        for (Issue issue : issues) {
            String[] row = extractIssueData(issue, dtf);
            for (int i = 0; i < row.length; i++) {
                sb.append(escapeCsvField(sanitizeForSpreadsheet(row[i])));
                if (i < row.length - 1) sb.append(",");
            }
            sb.append("\n");
        }

        return sb.toString().getBytes(StandardCharsets.UTF_8);
    }

    public byte[] generateExcel(List<Issue> issues) {
        if (issues.size() > maxExportRows) {
            throw new BusinessException(
                    ErrorCode.EXPORT_LIMIT_EXCEEDED,
                    "Vượt quá giới hạn xuất dữ liệu (" + maxExportRows + " dòng). Vui lòng thu hẹp bộ lọc."
            );
        }

        Workbook workbook = null;
        try (ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            // For smaller datasets or containerized environments without temp file access, use XSSFWorkbook
            try {
                if (issues.size() > 2000) {
                    workbook = new SXSSFWorkbook(100);
                } else {
                    workbook = new XSSFWorkbook();
                }
            } catch (Throwable t) {
                log.warn("SXSSFWorkbook initialization failed, falling back to XSSFWorkbook: {}", t.getMessage());
                workbook = new XSSFWorkbook();
            }

            ExcelStyleHelper styleHelper = new ExcelStyleHelper(workbook);

            Sheet sheet = workbook.createSheet("Issues");
            ExcelStyleHelper.prepareSheet(sheet);

            // Header Row
            Row headerRow = sheet.createRow(0);
            headerRow.setHeightInPoints(ExcelStyleHelper.HEADER_ROW_HEIGHT);
            for (int i = 0; i < HEADERS.length; i++) {
                Cell cell = headerRow.createCell(i);
                cell.setCellValue(HEADERS[i]);
                cell.setCellStyle(styleHelper.getHeaderCenterStyle());
            }

            DateTimeFormatter dtf = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm");
            int rowIdx = 1;
            for (Issue issue : issues) {
                Row row = sheet.createRow(rowIdx++);
                row.setHeightInPoints(ExcelStyleHelper.DATA_ROW_HEIGHT);
                boolean isZebra = (rowIdx % 2 == 1);
                String[] data = extractIssueData(issue, dtf);

                for (int i = 0; i < data.length; i++) {
                    Cell cell = row.createCell(i);
                    cell.setCellValue(sanitizeForSpreadsheet(data[i]));

                    // Apply proper column styling and alignment
                    if (i == 1 || i == 4 || i == 5) {
                        // Summary, Assignee, Reporter -> Left
                        cell.setCellStyle(styleHelper.getDataLeftStyle(isZebra));
                    } else if (i == 8 || i == 9 || i == 10) {
                        // Original Estimate, Remaining, Time Spent -> Right
                        cell.setCellStyle(styleHelper.getDataRightStyle(isZebra));
                    } else {
                        // Key, Type, Status, Priority, DueDate, CreatedAt, UpdatedAt -> Center
                        cell.setCellStyle(styleHelper.getDataCenterStyle(isZebra));
                    }
                }
            }

            // Freeze top header row
            sheet.createFreezePane(0, 1);

            // AutoFilter
            if (!issues.isEmpty()) {
                sheet.setAutoFilter(new CellRangeAddress(0, issues.size(), 0, HEADERS.length - 1));
            }

            // Auto size columns with generous min widths and max bound
            int[] minWidths = {15, 32, 14, 16, 22, 22, 16, 16, 16, 16, 18, 18, 18};
            ExcelStyleHelper.formatColumns(sheet, minWidths, 55);

            workbook.write(out);
            if (workbook instanceof SXSSFWorkbook sxssf) {
                sxssf.dispose();
            }
            return out.toByteArray();
        } catch (Exception e) {
            log.error("Lỗi khi xuất file Excel: {}", e.getMessage(), e);
            throw new BusinessException("Lỗi tạo file Excel: " + (e.getMessage() != null ? e.getMessage() : e.getClass().getSimpleName()));
        } finally {
            if (workbook != null) {
                try {
                    workbook.close();
                } catch (Exception ignored) {
                }
            }
        }
    }

    private String[] extractIssueData(Issue issue, DateTimeFormatter dtf) {
        String assigneeName = "Chưa giao";
        try {
            if (issue.getAssignee() != null) {
                String full = issue.getAssignee().getFullName();
                assigneeName = (full != null && !full.isBlank()) ? full : issue.getAssignee().getEmail();
            }
        } catch (Exception e) {
            log.debug("Lazy load assignee failed: {}", e.getMessage());
        }

        String reporterName = "";
        try {
            if (issue.getReporter() != null) {
                String full = issue.getReporter().getFullName();
                reporterName = (full != null && !full.isBlank()) ? full : issue.getReporter().getEmail();
            }
        } catch (Exception e) {
            log.debug("Lazy load reporter failed: {}", e.getMessage());
        }

        String statusName = "";
        try {
            if (issue.getStatus() != null) {
                statusName = issue.getStatus().getName();
            }
        } catch (Exception e) {
            log.debug("Lazy load status failed: {}", e.getMessage());
        }

        return new String[]{
                issue.getIssueKey() != null ? issue.getIssueKey() : "",
                issue.getSummary() != null ? issue.getSummary() : "",
                issue.getType() != null ? issue.getType().name() : "",
                statusName,
                assigneeName,
                reporterName,
                issue.getPriority() != null ? issue.getPriority().name() : "",
                issue.getDueDate() != null ? issue.getDueDate().toString() : "",
                DurationParser.formatMinutes(issue.getOriginalEstimateMin()),
                DurationParser.formatMinutes(issue.getRemainingEstimateMin()),
                DurationParser.formatMinutes(issue.getTimeSpentMin()),
                issue.getCreatedAt() != null ? issue.getCreatedAt().format(dtf) : "",
                issue.getUpdatedAt() != null ? issue.getUpdatedAt().format(dtf) : ""
        };
    }

    private String escapeCsvField(String field) {
        if (field == null) return "\"\"";
        String escaped = field.replace("\"", "\"\"");
        return "\"" + escaped + "\"";
    }

    /**
     * Backward-compatibility method for Sprint 2 unit tests
     */
    public byte[] exportToCsv(List<Issue> issues) {
        return generateCsv(issues);
    }

    @Override
    public byte[] generateProductivityExcel(Project project, ProductivityReportResponse report, List<Issue> issues, List<Worklog> worklogs, ProductivityFilterRequest filter, User currentUser) {
        int totalRows = (issues != null ? issues.size() : 0) + (worklogs != null ? worklogs.size() : 0) + (report != null && report.getMembers() != null ? report.getMembers().size() : 0);
        if (totalRows > maxExportRows) {
            throw new BusinessException(
                    ErrorCode.EXPORT_LIMIT_EXCEEDED,
                    "Vượt quá giới hạn xuất dữ liệu (" + maxExportRows + " dòng). Vui lòng thu hẹp bộ lọc."
            );
        }

        Workbook workbook = null;
        try (ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            workbook = new XSSFWorkbook();
            ExcelStyleHelper styleHelper = new ExcelStyleHelper(workbook);
            DateTimeFormatter dtf = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm");

            // Sheet 1: Tổng quan
            Sheet sheet1 = workbook.createSheet("Tổng quan");
            ExcelStyleHelper.prepareSheet(sheet1);

            int r1 = 0;
            // Title Row
            Row titleRow = sheet1.createRow(r1++);
            titleRow.setHeightInPoints(ExcelStyleHelper.TITLE_ROW_HEIGHT);
            Cell titleCell = titleRow.createCell(0);
            titleCell.setCellValue(sanitizeForSpreadsheet("BÁO CÁO NĂNG SUẤT DỰ ÁN"));
            titleCell.setCellStyle(styleHelper.getTitleStyle());

            // Blank line
            Row blank1 = sheet1.createRow(r1++);
            blank1.setHeightInPoints(ExcelStyleHelper.SPACER_ROW_HEIGHT);

            String exporterName = currentUser != null ? (currentUser.getFullName() != null ? currentUser.getFullName() : currentUser.getEmail()) : "Hệ thống";

            String[][] metaInfo = {
                    {"Dự án:", project != null ? project.getName() + " (" + project.getProjectKey() + ")" : ""},
                    {"Người xuất:", exporterName},
                    {"Thời điểm xuất:", java.time.LocalDateTime.now().format(dtf)},
                    {"Kỳ báo cáo:", (report != null && report.getFrom() != null ? report.getFrom().toString() : "") + " đến " + (report != null && report.getTo() != null ? report.getTo().toString() : "")},
                    {"Bộ lọc thành viên:", filter != null && filter.getMemberIds() != null && !filter.getMemberIds().isEmpty() ? filter.getMemberIds().toString() : "Tất cả"},
                    {"Bộ lọc vai trò:", filter != null && filter.getRoles() != null && !filter.getRoles().isEmpty() ? String.join(", ", filter.getRoles()) : "Tất cả"},
                    {"Bộ lọc loại công việc:", filter != null && filter.getIssueTypes() != null && !filter.getIssueTypes().isEmpty() ? String.join(", ", filter.getIssueTypes()) : "Tất cả"},
                    {"Bộ lọc độ ưu tiên:", filter != null && filter.getPriorities() != null && !filter.getPriorities().isEmpty() ? String.join(", ", filter.getPriorities()) : "Tất cả"},
                    {"Bộ lọc trạng thái:", filter != null && filter.getStatuses() != null && !filter.getStatuses().isEmpty() ? String.join(", ", filter.getStatuses()) : "Tất cả"},
                    {"Chỉ việc quá hạn:", filter != null && Boolean.TRUE.equals(filter.getOverdueOnly()) ? "Có" : "Không"}
            };

            for (String[] meta : metaInfo) {
                Row r = sheet1.createRow(r1++);
                r.setHeightInPoints(ExcelStyleHelper.INFO_ROW_HEIGHT);

                Cell c0 = r.createCell(0);
                c0.setCellValue(sanitizeForSpreadsheet(meta[0]));
                c0.setCellStyle(styleHelper.getInfoLabelStyle());

                Cell c1 = r.createCell(1);
                c1.setCellValue(sanitizeForSpreadsheet(meta[1]));
                c1.setCellStyle(styleHelper.getInfoValueStyle());
            }

            // Blank line
            Row blank2 = sheet1.createRow(r1++);
            blank2.setHeightInPoints(ExcelStyleHelper.SPACER_ROW_HEIGHT);

            // Summary metrics header
            Row statsHeaderRow = sheet1.createRow(r1++);
            statsHeaderRow.setHeightInPoints(ExcelStyleHelper.HEADER_ROW_HEIGHT);

            Cell sh0 = statsHeaderRow.createCell(0);
            sh0.setCellValue(sanitizeForSpreadsheet("CHỈ SỐ TỔNG HỢP"));
            sh0.setCellStyle(styleHelper.getHeaderLeftStyle());

            Cell sh1 = statsHeaderRow.createCell(1);
            sh1.setCellValue(sanitizeForSpreadsheet("GIÁ TRỊ"));
            sh1.setCellStyle(styleHelper.getHeaderRightStyle());

            String[][] summaryData = {
                    {"Tổng công việc được giao", report != null ? String.valueOf(report.getTotalAssigned()) : "0"},
                    {"Đã hoàn thành", report != null ? String.valueOf(report.getTotalCompleted()) : "0"},
                    {"Đang thực hiện", report != null ? String.valueOf(report.getTotalInProgress()) : "0"},
                    {"Chưa bắt đầu", report != null ? String.valueOf(report.getTotalTodo()) : "0"},
                    {"Số công việc quá hạn", report != null ? String.valueOf(report.getTotalOverdue()) : "0"},
                    {"Tỷ lệ đúng hạn (%)", report != null && report.getOverallOnTimeRate() != null ? report.getOverallOnTimeRate() + "%" : "100%"},
                    {"Tổng giờ ước lượng (h)", report != null && report.getTotalEstimatedHours() != null ? String.valueOf(report.getTotalEstimatedHours()) : "0"},
                    {"Tổng giờ đã log (h)", report != null && report.getTotalLoggedHours() != null ? String.valueOf(report.getTotalLoggedHours()) : "0"},
                    {"Thời gian xử lý trung bình (h)", report != null && report.getAvgResolutionTimeHours() != null ? String.valueOf(report.getAvgResolutionTimeHours()) : "N/A"},
                    {"Bug được giao", report != null ? String.valueOf(report.getTotalBugsAssigned()) : "0"},
                    {"Bug đã giải quyết", report != null ? String.valueOf(report.getTotalBugsResolved()) : "0"},
                    {"Bug bị reopen", report != null ? String.valueOf(report.getTotalBugsReopened()) : "0"}
            };

            int metricIdx = 0;
            for (String[] rowData : summaryData) {
                Row r = sheet1.createRow(r1++);
                r.setHeightInPoints(ExcelStyleHelper.DATA_ROW_HEIGHT);
                boolean isZebra = (metricIdx++ % 2 == 1);

                Cell c0 = r.createCell(0);
                c0.setCellValue(sanitizeForSpreadsheet(rowData[0]));
                c0.setCellStyle(styleHelper.getDataLeftStyle(isZebra));

                Cell c1 = r.createCell(1);
                c1.setCellValue(sanitizeForSpreadsheet(rowData[1]));
                c1.setCellStyle(styleHelper.getDataRightStyle(isZebra));
            }

            sheet1.setColumnWidth(0, 36 * 256);
            sheet1.setColumnWidth(1, 48 * 256);

            // Sheet 2: Theo thành viên
            Sheet sheet2 = workbook.createSheet("Theo thành viên");
            ExcelStyleHelper.prepareSheet(sheet2);

            String[] s2Headers = {
                    "Thành viên", "Email", "Vai trò", "Công việc giao", "Đã hoàn thành", "Đang làm",
                    "Chưa bắt đầu", "Đúng hạn (%)", "Quá hạn", "Giờ ước lượng (h)", "Giờ log (h)",
                    "Chênh lệch (%)", "Thời gian xử lý TB (h)", "Bug giao", "Bug sửa", "Bug reopen", "Mức tải"
            };
            Row s2HeaderRow = sheet2.createRow(0);
            s2HeaderRow.setHeightInPoints(ExcelStyleHelper.HEADER_ROW_HEIGHT);
            for (int i = 0; i < s2Headers.length; i++) {
                Cell c = s2HeaderRow.createCell(i);
                c.setCellValue(sanitizeForSpreadsheet(s2Headers[i]));
                c.setCellStyle(styleHelper.getHeaderCenterStyle());
            }

            int r2 = 1;
            if (report != null && report.getMembers() != null) {
                for (MemberProductivityDto m : report.getMembers()) {
                    Row r = sheet2.createRow(r2++);
                    r.setHeightInPoints(ExcelStyleHelper.DATA_ROW_HEIGHT);
                    boolean isZebra = (r2 % 2 == 1);

                    createStyledCell(r, 0, sanitizeForSpreadsheet(m.getFullName()), styleHelper.getDataLeftStyle(isZebra));
                    createStyledCell(r, 1, sanitizeForSpreadsheet(m.getEmail()), styleHelper.getDataLeftStyle(isZebra));
                    createStyledCell(r, 2, sanitizeForSpreadsheet(m.getProjectRole()), styleHelper.getDataCenterStyle(isZebra));

                    createStyledNumericCell(r, 3, m.getAssignedIssues(), styleHelper.getDataIntegerStyle(isZebra));
                    createStyledNumericCell(r, 4, m.getCompletedIssues(), styleHelper.getDataIntegerStyle(isZebra));
                    createStyledNumericCell(r, 5, m.getInProgressIssues(), styleHelper.getDataIntegerStyle(isZebra));
                    createStyledNumericCell(r, 6, m.getTodoIssues(), styleHelper.getDataIntegerStyle(isZebra));

                    createStyledNumericCell(r, 7, m.getOnTimeRate() != null ? m.getOnTimeRate() : 0.0, styleHelper.getDataDecimalStyle(isZebra));
                    createStyledNumericCell(r, 8, m.getOverdueIssues(), styleHelper.getDataIntegerStyle(isZebra));
                    createStyledNumericCell(r, 9, m.getEstimatedHours() != null ? m.getEstimatedHours() : 0.0, styleHelper.getDataDecimalStyle(isZebra));
                    createStyledNumericCell(r, 10, m.getTotalLoggedHours() != null ? m.getTotalLoggedHours() : 0.0, styleHelper.getDataDecimalStyle(isZebra));
                    createStyledNumericCell(r, 11, m.getVariancePercentage() != null ? m.getVariancePercentage() : 0.0, styleHelper.getDataDecimalStyle(isZebra));

                    if (m.getAvgResolutionTimeHours() != null) {
                        createStyledNumericCell(r, 12, m.getAvgResolutionTimeHours(), styleHelper.getDataDecimalStyle(isZebra));
                    } else {
                        createStyledCell(r, 12, "N/A", styleHelper.getDataCenterStyle(isZebra));
                    }

                    createStyledNumericCell(r, 13, m.getBugsAssigned(), styleHelper.getDataIntegerStyle(isZebra));
                    createStyledNumericCell(r, 14, m.getBugsResolved(), styleHelper.getDataIntegerStyle(isZebra));
                    createStyledNumericCell(r, 15, m.getBugsReopened(), styleHelper.getDataIntegerStyle(isZebra));
                    createStyledCell(r, 16, sanitizeForSpreadsheet(m.getWorkloadLevel() != null ? m.getWorkloadLevel().name() : ""), styleHelper.getDataCenterStyle(isZebra));
                }
            }

            sheet2.createFreezePane(0, 1);
            if (report != null && report.getMembers() != null && !report.getMembers().isEmpty()) {
                sheet2.setAutoFilter(new CellRangeAddress(0, report.getMembers().size(), 0, s2Headers.length - 1));
            }
            int[] s2MinWidths = {24, 28, 16, 16, 16, 14, 14, 15, 14, 18, 16, 16, 22, 14, 14, 14, 15};
            ExcelStyleHelper.formatColumns(sheet2, s2MinWidths, 40);

            // Sheet 3: Chi tiết Issue
            Sheet sheet3 = workbook.createSheet("Chi tiết Issue");
            ExcelStyleHelper.prepareSheet(sheet3);

            String[] s3Headers = {
                    "Mã công việc", "Tiêu đề", "Loại", "Mức ưu tiên", "Trạng thái", "Người thực hiện",
                    "Người báo cáo", "Hạn hoàn thành", "Ước tính (h)", "Đã log (h)", "Ngày tạo", "Cập nhật lần cuối"
            };
            Row s3HeaderRow = sheet3.createRow(0);
            s3HeaderRow.setHeightInPoints(ExcelStyleHelper.HEADER_ROW_HEIGHT);
            for (int i = 0; i < s3Headers.length; i++) {
                Cell c = s3HeaderRow.createCell(i);
                c.setCellValue(sanitizeForSpreadsheet(s3Headers[i]));
                c.setCellStyle(styleHelper.getHeaderCenterStyle());
            }

            int r3 = 1;
            if (issues != null) {
                for (Issue is : issues) {
                    Row r = sheet3.createRow(r3++);
                    r.setHeightInPoints(ExcelStyleHelper.DATA_ROW_HEIGHT);
                    boolean isZebra = (r3 % 2 == 1);

                    createStyledCell(r, 0, sanitizeForSpreadsheet(is.getIssueKey()), styleHelper.getDataCenterStyle(isZebra));
                    createStyledCell(r, 1, sanitizeForSpreadsheet(is.getSummary()), styleHelper.getDataLeftStyle(isZebra));
                    createStyledCell(r, 2, sanitizeForSpreadsheet(is.getType() != null ? is.getType().name() : ""), styleHelper.getDataCenterStyle(isZebra));
                    createStyledCell(r, 3, sanitizeForSpreadsheet(is.getPriority() != null ? is.getPriority().name() : ""), styleHelper.getDataCenterStyle(isZebra));
                    createStyledCell(r, 4, sanitizeForSpreadsheet(is.getStatus() != null ? is.getStatus().getName() : ""), styleHelper.getDataCenterStyle(isZebra));

                    String assigneeName = "Chưa phân công";
                    if (is.getAssignee() != null) {
                        assigneeName = is.getAssignee().getFullName() != null ? is.getAssignee().getFullName() : is.getAssignee().getEmail();
                    }
                    createStyledCell(r, 5, sanitizeForSpreadsheet(assigneeName), styleHelper.getDataLeftStyle(isZebra));

                    String reporterName = "";
                    if (is.getReporter() != null) {
                        reporterName = is.getReporter().getFullName() != null ? is.getReporter().getFullName() : is.getReporter().getEmail();
                    }
                    createStyledCell(r, 6, sanitizeForSpreadsheet(reporterName), styleHelper.getDataLeftStyle(isZebra));

                    createStyledCell(r, 7, sanitizeForSpreadsheet(is.getDueDate() != null ? is.getDueDate().toString() : ""), styleHelper.getDataCenterStyle(isZebra));

                    double estH = is.getOriginalEstimateMin() != null ? Math.round((is.getOriginalEstimateMin() / 60.0) * 100.0) / 100.0 : 0.0;
                    double spentH = is.getTimeSpentMin() != null ? Math.round((is.getTimeSpentMin() / 60.0) * 100.0) / 100.0 : 0.0;
                    createStyledNumericCell(r, 8, estH, styleHelper.getDataDecimalStyle(isZebra));
                    createStyledNumericCell(r, 9, spentH, styleHelper.getDataDecimalStyle(isZebra));

                    createStyledCell(r, 10, sanitizeForSpreadsheet(is.getCreatedAt() != null ? is.getCreatedAt().format(dtf) : ""), styleHelper.getDataCenterStyle(isZebra));
                    createStyledCell(r, 11, sanitizeForSpreadsheet(is.getUpdatedAt() != null ? is.getUpdatedAt().format(dtf) : ""), styleHelper.getDataCenterStyle(isZebra));
                }
            }

            sheet3.createFreezePane(0, 1);
            if (issues != null && !issues.isEmpty()) {
                sheet3.setAutoFilter(new CellRangeAddress(0, issues.size(), 0, s3Headers.length - 1));
            }
            int[] s3MinWidths = {15, 32, 14, 16, 16, 22, 22, 16, 16, 16, 18, 18};
            ExcelStyleHelper.formatColumns(sheet3, s3MinWidths, 55);

            // Sheet 4: Log thời gian
            Sheet sheet4 = workbook.createSheet("Log thời gian");
            ExcelStyleHelper.prepareSheet(sheet4);

            String[] s4Headers = {
                    "Mã công việc", "Tiêu đề công việc", "Thành viên log", "Email", "Ngày làm việc",
                    "Thời gian (h)", "Thời gian (phút)", "Ghi chú", "Thời điểm tạo"
            };
            Row s4HeaderRow = sheet4.createRow(0);
            s4HeaderRow.setHeightInPoints(ExcelStyleHelper.HEADER_ROW_HEIGHT);
            for (int i = 0; i < s4Headers.length; i++) {
                Cell c = s4HeaderRow.createCell(i);
                c.setCellValue(sanitizeForSpreadsheet(s4Headers[i]));
                c.setCellStyle(styleHelper.getHeaderCenterStyle());
            }

            int r4 = 1;
            if (worklogs != null) {
                for (Worklog wl : worklogs) {
                    Row r = sheet4.createRow(r4++);
                    r.setHeightInPoints(ExcelStyleHelper.DATA_ROW_HEIGHT);
                    boolean isZebra = (r4 % 2 == 1);

                    String key = wl.getIssue() != null ? wl.getIssue().getIssueKey() : "";
                    String sum = wl.getIssue() != null ? wl.getIssue().getSummary() : "";
                    String uName = wl.getUser() != null ? (wl.getUser().getFullName() != null ? wl.getUser().getFullName() : wl.getUser().getEmail()) : "";
                    String uEmail = wl.getUser() != null ? wl.getUser().getEmail() : "";
                    int min = wl.getTimeSpentMin() != null ? wl.getTimeSpentMin() : 0;
                    double h = Math.round((min / 60.0) * 100.0) / 100.0;

                    createStyledCell(r, 0, sanitizeForSpreadsheet(key), styleHelper.getDataCenterStyle(isZebra));
                    createStyledCell(r, 1, sanitizeForSpreadsheet(sum), styleHelper.getDataLeftStyle(isZebra));
                    createStyledCell(r, 2, sanitizeForSpreadsheet(uName), styleHelper.getDataLeftStyle(isZebra));
                    createStyledCell(r, 3, sanitizeForSpreadsheet(uEmail), styleHelper.getDataLeftStyle(isZebra));
                    createStyledCell(r, 4, sanitizeForSpreadsheet(wl.getWorkDate() != null ? wl.getWorkDate().toString() : ""), styleHelper.getDataCenterStyle(isZebra));
                    createStyledNumericCell(r, 5, h, styleHelper.getDataDecimalStyle(isZebra));
                    createStyledNumericCell(r, 6, min, styleHelper.getDataIntegerStyle(isZebra));
                    createStyledCell(r, 7, sanitizeForSpreadsheet(wl.getComment()), styleHelper.getDataLeftStyle(isZebra));
                    createStyledCell(r, 8, sanitizeForSpreadsheet(wl.getCreatedAt() != null ? wl.getCreatedAt().format(dtf) : ""), styleHelper.getDataCenterStyle(isZebra));
                }
            }

            sheet4.createFreezePane(0, 1);
            if (worklogs != null && !worklogs.isEmpty()) {
                sheet4.setAutoFilter(new CellRangeAddress(0, worklogs.size(), 0, s4Headers.length - 1));
            }
            int[] s4MinWidths = {15, 32, 22, 28, 16, 16, 16, 30, 18};
            ExcelStyleHelper.formatColumns(sheet4, s4MinWidths, 55);

            workbook.write(out);
            return out.toByteArray();
        } catch (BusinessException be) {
            throw be;
        } catch (Exception e) {
            log.error("Lỗi khi xuất file Excel báo cáo năng suất: {}", e.getMessage(), e);
            throw new BusinessException("Lỗi tạo file Excel: " + (e.getMessage() != null ? e.getMessage() : e.getClass().getSimpleName()));
        } finally {
            if (workbook != null) {
                try {
                    workbook.close();
                } catch (Exception ignored) {}
            }
        }
    }

    @Override
    public byte[] generateProductivityCsv(Project project, ProductivityReportResponse report, List<Issue> issues, List<Worklog> worklogs, ProductivityFilterRequest filter, User currentUser) {
        int totalRows = (issues != null ? issues.size() : 0) + (worklogs != null ? worklogs.size() : 0) + (report != null && report.getMembers() != null ? report.getMembers().size() : 0);
        if (totalRows > maxExportRows) {
            throw new BusinessException(
                    ErrorCode.EXPORT_LIMIT_EXCEEDED,
                    "Vượt quá giới hạn xuất dữ liệu (" + maxExportRows + " dòng). Vui lòng thu hẹp bộ lọc."
            );
        }

        StringBuilder sb = new StringBuilder();
        // UTF-8 BOM
        sb.append('\uFEFF');

        DateTimeFormatter dtf = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm");
        String exporterName = currentUser != null ? (currentUser.getFullName() != null ? currentUser.getFullName() : currentUser.getEmail()) : "Hệ thống";

        // Section 1: Meta
        appendCsvRow(sb, "BÁO CÁO NĂNG SUẤT DỰ ÁN");
        appendCsvRow(sb, "Dự án:", project != null ? project.getName() + " (" + project.getProjectKey() + ")" : "");
        appendCsvRow(sb, "Người xuất:", exporterName);
        appendCsvRow(sb, "Thời điểm xuất:", java.time.LocalDateTime.now().format(dtf));
        appendCsvRow(sb, "Kỳ báo cáo:", (report != null && report.getFrom() != null ? report.getFrom().toString() : "") + " đến " + (report != null && report.getTo() != null ? report.getTo().toString() : ""));
        appendCsvRow(sb, "Bộ lọc thành viên:", filter != null && filter.getMemberIds() != null && !filter.getMemberIds().isEmpty() ? filter.getMemberIds().toString() : "Tất cả");
        appendCsvRow(sb, "Bộ lọc vai trò:", filter != null && filter.getRoles() != null && !filter.getRoles().isEmpty() ? String.join(", ", filter.getRoles()) : "Tất cả");
        appendCsvRow(sb, "Bộ lọc loại công việc:", filter != null && filter.getIssueTypes() != null && !filter.getIssueTypes().isEmpty() ? String.join(", ", filter.getIssueTypes()) : "Tất cả");
        appendCsvRow(sb, "Bộ lọc độ ưu tiên:", filter != null && filter.getPriorities() != null && !filter.getPriorities().isEmpty() ? String.join(", ", filter.getPriorities()) : "Tất cả");
        appendCsvRow(sb, "Bộ lọc trạng thái:", filter != null && filter.getStatuses() != null && !filter.getStatuses().isEmpty() ? String.join(", ", filter.getStatuses()) : "Tất cả");
        appendCsvRow(sb, "Chỉ việc quá hạn:", filter != null && Boolean.TRUE.equals(filter.getOverdueOnly()) ? "Có" : "Không");
        sb.append("\n");

        // Section 2: Summary KPIs
        appendCsvRow(sb, "CHỈ SỐ TỔNG HỢP", "GIÁ TRỊ");
        appendCsvRow(sb, "Tổng công việc được giao", report != null ? String.valueOf(report.getTotalAssigned()) : "0");
        appendCsvRow(sb, "Đã hoàn thành", report != null ? String.valueOf(report.getTotalCompleted()) : "0");
        appendCsvRow(sb, "Đang thực hiện", report != null ? String.valueOf(report.getTotalInProgress()) : "0");
        appendCsvRow(sb, "Chưa bắt đầu", report != null ? String.valueOf(report.getTotalTodo()) : "0");
        appendCsvRow(sb, "Số công việc quá hạn", report != null ? String.valueOf(report.getTotalOverdue()) : "0");
        appendCsvRow(sb, "Tỷ lệ đúng hạn (%)", report != null && report.getOverallOnTimeRate() != null ? report.getOverallOnTimeRate() + "%" : "100%");
        appendCsvRow(sb, "Tổng giờ ước lượng (h)", report != null && report.getTotalEstimatedHours() != null ? String.valueOf(report.getTotalEstimatedHours()) : "0");
        appendCsvRow(sb, "Tổng giờ đã log (h)", report != null && report.getTotalLoggedHours() != null ? String.valueOf(report.getTotalLoggedHours()) : "0");
        appendCsvRow(sb, "Thời gian xử lý trung bình (h)", report != null && report.getAvgResolutionTimeHours() != null ? String.valueOf(report.getAvgResolutionTimeHours()) : "N/A");
        appendCsvRow(sb, "Bug được giao", report != null ? String.valueOf(report.getTotalBugsAssigned()) : "0");
        appendCsvRow(sb, "Bug đã giải quyết", report != null ? String.valueOf(report.getTotalBugsResolved()) : "0");
        appendCsvRow(sb, "Bug bị reopen", report != null ? String.valueOf(report.getTotalBugsReopened()) : "0");
        sb.append("\n");

        // Section 3: Member Productivity
        appendCsvRow(sb, "NĂNG SUẤT THEO THÀNH VIÊN");
        String[] s2Headers = {
                "Thành viên", "Email", "Vai trò", "Công việc giao", "Đã hoàn thành", "Đang làm",
                "Chưa bắt đầu", "Đúng hạn (%)", "Quá hạn", "Giờ ước lượng (h)", "Giờ log (h)",
                "Chênh lệch (%)", "Thời gian xử lý TB (h)", "Bug giao", "Bug sửa", "Bug reopen", "Mức tải"
        };
        appendCsvRow(sb, s2Headers);
        if (report != null && report.getMembers() != null) {
            for (MemberProductivityDto m : report.getMembers()) {
                appendCsvRow(sb,
                        m.getFullName() != null ? m.getFullName() : "",
                        m.getEmail() != null ? m.getEmail() : "",
                        m.getProjectRole() != null ? m.getProjectRole() : "",
                        String.valueOf(m.getAssignedIssues()),
                        String.valueOf(m.getCompletedIssues()),
                        String.valueOf(m.getInProgressIssues()),
                        String.valueOf(m.getTodoIssues()),
                        m.getOnTimeRate() != null ? String.valueOf(m.getOnTimeRate()) : "0.0",
                        String.valueOf(m.getOverdueIssues()),
                        m.getEstimatedHours() != null ? String.valueOf(m.getEstimatedHours()) : "0.0",
                        m.getTotalLoggedHours() != null ? String.valueOf(m.getTotalLoggedHours()) : "0.0",
                        m.getVariancePercentage() != null ? String.valueOf(m.getVariancePercentage()) : "0.0",
                        m.getAvgResolutionTimeHours() != null ? String.valueOf(m.getAvgResolutionTimeHours()) : "N/A",
                        String.valueOf(m.getBugsAssigned()),
                        String.valueOf(m.getBugsResolved()),
                        String.valueOf(m.getBugsReopened()),
                        m.getWorkloadLevel() != null ? m.getWorkloadLevel().name() : ""
                );
            }
        }
        sb.append("\n");

        // Section 4: Issue Breakdown
        appendCsvRow(sb, "CHI TIẾT CÔNG VIỆC");
        String[] s3Headers = {
                "Mã công việc", "Tiêu đề", "Loại", "Mức ưu tiên", "Trạng thái", "Người thực hiện",
                "Người báo cáo", "Hạn hoàn thành", "Ước tính (h)", "Đã log (h)", "Ngày tạo", "Cập nhật lần cuối"
        };
        appendCsvRow(sb, s3Headers);
        if (issues != null) {
            for (Issue is : issues) {
                String assigneeName = "Chưa phân công";
                if (is.getAssignee() != null) {
                    assigneeName = is.getAssignee().getFullName() != null ? is.getAssignee().getFullName() : is.getAssignee().getEmail();
                }
                String reporterName = "";
                if (is.getReporter() != null) {
                    reporterName = is.getReporter().getFullName() != null ? is.getReporter().getFullName() : is.getReporter().getEmail();
                }
                double estH = is.getOriginalEstimateMin() != null ? Math.round((is.getOriginalEstimateMin() / 60.0) * 100.0) / 100.0 : 0.0;
                double spentH = is.getTimeSpentMin() != null ? Math.round((is.getTimeSpentMin() / 60.0) * 100.0) / 100.0 : 0.0;

                appendCsvRow(sb,
                        is.getIssueKey() != null ? is.getIssueKey() : "",
                        is.getSummary() != null ? is.getSummary() : "",
                        is.getType() != null ? is.getType().name() : "",
                        is.getPriority() != null ? is.getPriority().name() : "",
                        is.getStatus() != null ? is.getStatus().getName() : "",
                        assigneeName,
                        reporterName,
                        is.getDueDate() != null ? is.getDueDate().toString() : "",
                        String.valueOf(estH),
                        String.valueOf(spentH),
                        is.getCreatedAt() != null ? is.getCreatedAt().format(dtf) : "",
                        is.getUpdatedAt() != null ? is.getUpdatedAt().format(dtf) : ""
                );
            }
        }
        sb.append("\n");

        // Section 5: Worklogs
        appendCsvRow(sb, "LOG THỜI GIAN");
        String[] s4Headers = {
                "Mã công việc", "Tiêu đề công việc", "Thành viên log", "Email", "Ngày làm việc",
                "Thời gian (h)", "Thời gian (phút)", "Ghi chú", "Thời điểm tạo"
        };
        appendCsvRow(sb, s4Headers);
        if (worklogs != null) {
            for (Worklog wl : worklogs) {
                String key = wl.getIssue() != null ? wl.getIssue().getIssueKey() : "";
                String sum = wl.getIssue() != null ? wl.getIssue().getSummary() : "";
                String uName = wl.getUser() != null ? (wl.getUser().getFullName() != null ? wl.getUser().getFullName() : wl.getUser().getEmail()) : "";
                String uEmail = wl.getUser() != null ? wl.getUser().getEmail() : "";
                int min = wl.getTimeSpentMin() != null ? wl.getTimeSpentMin() : 0;
                double h = Math.round((min / 60.0) * 100.0) / 100.0;

                appendCsvRow(sb,
                        key,
                        sum,
                        uName,
                        uEmail,
                        wl.getWorkDate() != null ? wl.getWorkDate().toString() : "",
                        String.valueOf(h),
                        String.valueOf(min),
                        wl.getComment() != null ? wl.getComment() : "",
                        wl.getCreatedAt() != null ? wl.getCreatedAt().format(dtf) : ""
                );
            }
        }

        return sb.toString().getBytes(StandardCharsets.UTF_8);
    }

    private void appendCsvRow(StringBuilder sb, String... cells) {
        for (int i = 0; i < cells.length; i++) {
            sb.append(escapeCsvField(sanitizeForSpreadsheet(cells[i])));
            if (i < cells.length - 1) sb.append(",");
        }
        sb.append("\n");
    }

    private void createStyledCell(Row row, int colIndex, String value, CellStyle style) {
        Cell cell = row.createCell(colIndex);
        cell.setCellValue(value != null ? value : "");
        if (style != null) {
            cell.setCellStyle(style);
        }
    }

    private void createStyledNumericCell(Row row, int colIndex, double value, CellStyle style) {
        Cell cell = row.createCell(colIndex);
        cell.setCellValue(value);
        if (style != null) {
            cell.setCellStyle(style);
        }
    }
}
