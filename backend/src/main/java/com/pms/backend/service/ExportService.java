package com.pms.backend.service;

import com.pms.backend.dto.IssueSearchRequest;
import com.pms.backend.enu.ErrorCode;
import com.pms.backend.exception.BusinessException;
import com.pms.backend.hibernateDao.IssueSearchDao;
import com.pms.backend.model.Issue;
import com.pms.backend.model.User;
import com.pms.backend.util.DurationParser;
import org.apache.poi.ss.usermodel.Cell;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.xssf.streaming.SXSSFWorkbook;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.time.format.DateTimeFormatter;
import java.util.List;

@Service
public class ExportService {

    @Value("${app.export.max-rows:10000}")
    private int maxExportRows = 10000;

    private final IssueSearchDao issueSearchDao;

    public ExportService() {
        this.issueSearchDao = null;
    }

    @Autowired
    public ExportService(IssueSearchDao issueSearchDao) {
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

        try (SXSSFWorkbook workbook = new SXSSFWorkbook(100);
             ByteArrayOutputStream out = new ByteArrayOutputStream()) {

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
            workbook.dispose();
            return out.toByteArray();
        } catch (IOException e) {
            throw new BusinessException("Lỗi tạo file Excel: " + e.getMessage());
        }
    }

    private String[] extractIssueData(Issue issue, DateTimeFormatter dtf) {
        return new String[]{
                issue.getIssueKey() != null ? issue.getIssueKey() : "",
                issue.getSummary() != null ? issue.getSummary() : "",
                issue.getType() != null ? issue.getType().name() : "",
                issue.getStatus() != null ? issue.getStatus().getName() : "",
                issue.getAssignee() != null ? issue.getAssignee().getFullName() : "Chưa giao",
                issue.getReporter() != null ? issue.getReporter().getFullName() : "",
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
}
