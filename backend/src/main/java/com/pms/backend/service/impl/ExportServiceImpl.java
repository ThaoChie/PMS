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
import org.apache.poi.ss.usermodel.Cell;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.usermodel.Workbook;
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

            Sheet sheet = workbook.createSheet("Issues");

            // Header Row
            Row headerRow = sheet.createRow(0);
            for (int i = 0; i < HEADERS.length; i++) {
                Cell cell = headerRow.createCell(i);
                cell.setCellValue(HEADERS[i]);
            }

            DateTimeFormatter dtf = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm");
            int rowIdx = 1;
            for (Issue issue : issues) {
                Row row = sheet.createRow(rowIdx++);
                String[] data = extractIssueData(issue, dtf);
                for (int i = 0; i < data.length; i++) {
                    Cell cell = row.createCell(i);
                    cell.setCellValue(sanitizeForSpreadsheet(data[i]));
                }
            }

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
            DateTimeFormatter dtf = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm");

            // Sheet 1: Tổng quan
            Sheet sheet1 = workbook.createSheet("Tổng quan");
            int r1 = 0;
            Row titleRow = sheet1.createRow(r1++);
            titleRow.createCell(0).setCellValue(sanitizeForSpreadsheet("BÁO CÁO NĂNG SUẤT DỰ ÁN"));

            sheet1.createRow(r1++); // blank line

            Row projRow = sheet1.createRow(r1++);
            projRow.createCell(0).setCellValue(sanitizeForSpreadsheet("Dự án:"));
            projRow.createCell(1).setCellValue(sanitizeForSpreadsheet(project != null ? project.getName() + " (" + project.getProjectKey() + ")" : ""));

            Row exporterRow = sheet1.createRow(r1++);
            exporterRow.createCell(0).setCellValue(sanitizeForSpreadsheet("Người xuất:"));
            String exporterName = currentUser != null ? (currentUser.getFullName() != null ? currentUser.getFullName() : currentUser.getEmail()) : "Hệ thống";
            exporterRow.createCell(1).setCellValue(sanitizeForSpreadsheet(exporterName));

            Row exportTimeRow = sheet1.createRow(r1++);
            exportTimeRow.createCell(0).setCellValue(sanitizeForSpreadsheet("Thời điểm xuất:"));
            exportTimeRow.createCell(1).setCellValue(sanitizeForSpreadsheet(java.time.LocalDateTime.now().format(dtf)));

            Row periodRow = sheet1.createRow(r1++);
            periodRow.createCell(0).setCellValue(sanitizeForSpreadsheet("Kỳ báo cáo:"));
            periodRow.createCell(1).setCellValue(sanitizeForSpreadsheet((report != null && report.getFrom() != null ? report.getFrom().toString() : "") + " đến " + (report != null && report.getTo() != null ? report.getTo().toString() : "")));

            Row filterMembersRow = sheet1.createRow(r1++);
            filterMembersRow.createCell(0).setCellValue(sanitizeForSpreadsheet("Bộ lọc thành viên:"));
            filterMembersRow.createCell(1).setCellValue(sanitizeForSpreadsheet(filter != null && filter.getMemberIds() != null && !filter.getMemberIds().isEmpty() ? filter.getMemberIds().toString() : "Tất cả"));

            Row filterRolesRow = sheet1.createRow(r1++);
            filterRolesRow.createCell(0).setCellValue(sanitizeForSpreadsheet("Bộ lọc vai trò:"));
            filterRolesRow.createCell(1).setCellValue(sanitizeForSpreadsheet(filter != null && filter.getRoles() != null && !filter.getRoles().isEmpty() ? String.join(", ", filter.getRoles()) : "Tất cả"));

            Row filterTypesRow = sheet1.createRow(r1++);
            filterTypesRow.createCell(0).setCellValue(sanitizeForSpreadsheet("Bộ lọc loại công việc:"));
            filterTypesRow.createCell(1).setCellValue(sanitizeForSpreadsheet(filter != null && filter.getIssueTypes() != null && !filter.getIssueTypes().isEmpty() ? String.join(", ", filter.getIssueTypes()) : "Tất cả"));

            Row filterPrioritiesRow = sheet1.createRow(r1++);
            filterPrioritiesRow.createCell(0).setCellValue(sanitizeForSpreadsheet("Bộ lọc độ ưu tiên:"));
            filterPrioritiesRow.createCell(1).setCellValue(sanitizeForSpreadsheet(filter != null && filter.getPriorities() != null && !filter.getPriorities().isEmpty() ? String.join(", ", filter.getPriorities()) : "Tất cả"));

            Row filterStatusesRow = sheet1.createRow(r1++);
            filterStatusesRow.createCell(0).setCellValue(sanitizeForSpreadsheet("Bộ lọc trạng thái:"));
            filterStatusesRow.createCell(1).setCellValue(sanitizeForSpreadsheet(filter != null && filter.getStatuses() != null && !filter.getStatuses().isEmpty() ? String.join(", ", filter.getStatuses()) : "Tất cả"));

            Row filterOverdueRow = sheet1.createRow(r1++);
            filterOverdueRow.createCell(0).setCellValue(sanitizeForSpreadsheet("Chỉ việc quá hạn:"));
            filterOverdueRow.createCell(1).setCellValue(sanitizeForSpreadsheet(filter != null && Boolean.TRUE.equals(filter.getOverdueOnly()) ? "Có" : "Không"));

            sheet1.createRow(r1++); // blank line

            Row statsHeaderRow = sheet1.createRow(r1++);
            statsHeaderRow.createCell(0).setCellValue(sanitizeForSpreadsheet("CHỈ SỐ TỔNG HỢP"));
            statsHeaderRow.createCell(1).setCellValue(sanitizeForSpreadsheet("GIÁ TRỊ"));

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
            for (String[] rowData : summaryData) {
                Row r = sheet1.createRow(r1++);
                r.createCell(0).setCellValue(sanitizeForSpreadsheet(rowData[0]));
                r.createCell(1).setCellValue(sanitizeForSpreadsheet(rowData[1]));
            }

            // Sheet 2: Theo thành viên
            Sheet sheet2 = workbook.createSheet("Theo thành viên");
            String[] s2Headers = {
                    "Thành viên", "Email", "Vai trò", "Công việc giao", "Đã hoàn thành", "Đang làm",
                    "Chưa bắt đầu", "Đúng hạn (%)", "Quá hạn", "Giờ ước lượng (h)", "Giờ log (h)",
                    "Chênh lệch (%)", "Thời gian xử lý TB (h)", "Bug giao", "Bug sửa", "Bug reopen", "Mức tải"
            };
            Row s2HeaderRow = sheet2.createRow(0);
            for (int i = 0; i < s2Headers.length; i++) {
                s2HeaderRow.createCell(i).setCellValue(sanitizeForSpreadsheet(s2Headers[i]));
            }
            int r2 = 1;
            if (report != null && report.getMembers() != null) {
                for (MemberProductivityDto m : report.getMembers()) {
                    Row r = sheet2.createRow(r2++);
                    r.createCell(0).setCellValue(sanitizeForSpreadsheet(m.getFullName()));
                    r.createCell(1).setCellValue(sanitizeForSpreadsheet(m.getEmail()));
                    r.createCell(2).setCellValue(sanitizeForSpreadsheet(m.getProjectRole()));
                    r.createCell(3).setCellValue(m.getAssignedIssues());
                    r.createCell(4).setCellValue(m.getCompletedIssues());
                    r.createCell(5).setCellValue(m.getInProgressIssues());
                    r.createCell(6).setCellValue(m.getTodoIssues());
                    r.createCell(7).setCellValue(m.getOnTimeRate() != null ? m.getOnTimeRate() : 0.0);
                    r.createCell(8).setCellValue(m.getOverdueIssues());
                    r.createCell(9).setCellValue(m.getEstimatedHours() != null ? m.getEstimatedHours() : 0.0);
                    r.createCell(10).setCellValue(m.getTotalLoggedHours() != null ? m.getTotalLoggedHours() : 0.0);
                    r.createCell(11).setCellValue(m.getVariancePercentage() != null ? m.getVariancePercentage() : 0.0);
                    r.createCell(12).setCellValue(m.getAvgResolutionTimeHours() != null ? String.valueOf(m.getAvgResolutionTimeHours()) : "N/A");
                    r.createCell(13).setCellValue(m.getBugsAssigned());
                    r.createCell(14).setCellValue(m.getBugsResolved());
                    r.createCell(15).setCellValue(m.getBugsReopened());
                    r.createCell(16).setCellValue(sanitizeForSpreadsheet(m.getWorkloadLevel() != null ? m.getWorkloadLevel().name() : ""));
                }
            }

            // Sheet 3: Chi tiết Issue
            Sheet sheet3 = workbook.createSheet("Chi tiết Issue");
            String[] s3Headers = {
                    "Mã công việc", "Tiêu đề", "Loại", "Mức ưu tiên", "Trạng thái", "Người thực hiện",
                    "Người báo cáo", "Hạn hoàn thành", "Ước tính (h)", "Đã log (h)", "Ngày tạo", "Cập nhật lần cuối"
            };
            Row s3HeaderRow = sheet3.createRow(0);
            for (int i = 0; i < s3Headers.length; i++) {
                s3HeaderRow.createCell(i).setCellValue(sanitizeForSpreadsheet(s3Headers[i]));
            }
            int r3 = 1;
            if (issues != null) {
                for (Issue is : issues) {
                    Row r = sheet3.createRow(r3++);
                    r.createCell(0).setCellValue(sanitizeForSpreadsheet(is.getIssueKey()));
                    r.createCell(1).setCellValue(sanitizeForSpreadsheet(is.getSummary()));
                    r.createCell(2).setCellValue(sanitizeForSpreadsheet(is.getType() != null ? is.getType().name() : ""));
                    r.createCell(3).setCellValue(sanitizeForSpreadsheet(is.getPriority() != null ? is.getPriority().name() : ""));
                    r.createCell(4).setCellValue(sanitizeForSpreadsheet(is.getStatus() != null ? is.getStatus().getName() : ""));

                    String assigneeName = "Chưa phân công";
                    if (is.getAssignee() != null) {
                        assigneeName = is.getAssignee().getFullName() != null ? is.getAssignee().getFullName() : is.getAssignee().getEmail();
                    }
                    r.createCell(5).setCellValue(sanitizeForSpreadsheet(assigneeName));

                    String reporterName = "";
                    if (is.getReporter() != null) {
                        reporterName = is.getReporter().getFullName() != null ? is.getReporter().getFullName() : is.getReporter().getEmail();
                    }
                    r.createCell(6).setCellValue(sanitizeForSpreadsheet(reporterName));

                    r.createCell(7).setCellValue(sanitizeForSpreadsheet(is.getDueDate() != null ? is.getDueDate().toString() : ""));
                    double estH = is.getOriginalEstimateMin() != null ? Math.round((is.getOriginalEstimateMin() / 60.0) * 100.0) / 100.0 : 0.0;
                    double spentH = is.getTimeSpentMin() != null ? Math.round((is.getTimeSpentMin() / 60.0) * 100.0) / 100.0 : 0.0;
                    r.createCell(8).setCellValue(estH);
                    r.createCell(9).setCellValue(spentH);
                    r.createCell(10).setCellValue(sanitizeForSpreadsheet(is.getCreatedAt() != null ? is.getCreatedAt().format(dtf) : ""));
                    r.createCell(11).setCellValue(sanitizeForSpreadsheet(is.getUpdatedAt() != null ? is.getUpdatedAt().format(dtf) : ""));
                }
            }

            // Sheet 4: Log thời gian
            Sheet sheet4 = workbook.createSheet("Log thời gian");
            String[] s4Headers = {
                    "Mã công việc", "Tiêu đề công việc", "Thành viên log", "Email", "Ngày làm việc",
                    "Thời gian (h)", "Thời gian (phút)", "Ghi chú", "Thời điểm tạo"
            };
            Row s4HeaderRow = sheet4.createRow(0);
            for (int i = 0; i < s4Headers.length; i++) {
                s4HeaderRow.createCell(i).setCellValue(sanitizeForSpreadsheet(s4Headers[i]));
            }
            int r4 = 1;
            if (worklogs != null) {
                for (Worklog wl : worklogs) {
                    Row r = sheet4.createRow(r4++);
                    String key = wl.getIssue() != null ? wl.getIssue().getIssueKey() : "";
                    String sum = wl.getIssue() != null ? wl.getIssue().getSummary() : "";
                    String uName = wl.getUser() != null ? (wl.getUser().getFullName() != null ? wl.getUser().getFullName() : wl.getUser().getEmail()) : "";
                    String uEmail = wl.getUser() != null ? wl.getUser().getEmail() : "";
                    int min = wl.getTimeSpentMin() != null ? wl.getTimeSpentMin() : 0;
                    double h = Math.round((min / 60.0) * 100.0) / 100.0;

                    r.createCell(0).setCellValue(sanitizeForSpreadsheet(key));
                    r.createCell(1).setCellValue(sanitizeForSpreadsheet(sum));
                    r.createCell(2).setCellValue(sanitizeForSpreadsheet(uName));
                    r.createCell(3).setCellValue(sanitizeForSpreadsheet(uEmail));
                    r.createCell(4).setCellValue(sanitizeForSpreadsheet(wl.getWorkDate() != null ? wl.getWorkDate().toString() : ""));
                    r.createCell(5).setCellValue(h);
                    r.createCell(6).setCellValue(min);
                    r.createCell(7).setCellValue(sanitizeForSpreadsheet(wl.getComment()));
                    r.createCell(8).setCellValue(sanitizeForSpreadsheet(wl.getCreatedAt() != null ? wl.getCreatedAt().format(dtf) : ""));
                }
            }

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
}
