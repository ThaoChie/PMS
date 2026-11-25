package com.pms.backend.service.impl;

import com.pms.backend.dao.ProjectRepository;
import com.pms.backend.dto.BugReportItemDto;
import com.pms.backend.dto.BugReportResponse;
import com.pms.backend.dto.BugReportRowDto;
import com.pms.backend.enu.ErrorCode;
import com.pms.backend.exception.BusinessException;
import com.pms.backend.hibernateDao.BugReportHibernateDao;
import com.pms.backend.model.Project;
import com.pms.backend.util.ExcelStyleHelper;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.ss.util.CellRangeAddress;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.ByteArrayOutputStream;
import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

/**
 * Xuất "Báo cáo lỗi (Bugs)" ra Excel (.xlsx) hoặc CSV.
 *
 * Trước đây tab Báo cáo lỗi dùng chung nút xuất với tab Tiến độ, gọi API xuất danh sách công việc
 * (/issues/export) -> cả 2 tab ra cùng một file, không có nội dung báo cáo lỗi.
 * File này chứa đúng những gì tab Báo cáo lỗi hiển thị: chỉ số tổng hợp, lỗi theo mức độ ưu tiên,
 * và thêm danh sách chi tiết từng lỗi.
 */
@Service
public class BugReportExportService {

    public static final String XLSX_MIME = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
    public static final String CSV_MIME = "text/csv;charset=utf-8";

    private static final ZoneId VN = ZoneId.of("Asia/Ho_Chi_Minh");
    private static final DateTimeFormatter DATE = DateTimeFormatter.ofPattern("dd/MM/yyyy");
    private static final DateTimeFormatter DATE_TIME = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm");
    private static final Map<String, String> PRIORITY_LABEL = Map.of(
            "HIGHEST", "Khẩn cấp nhất",
            "HIGH", "Cao",
            "MEDIUM", "Trung bình",
            "LOW", "Thấp",
            "LOWEST", "Rất thấp");

    static final String[] DETAIL_HEADERS = {"Mã", "Tiêu đề", "Mức độ ưu tiên", "Trạng thái", "Đã khắc phục",
            "Người thực hiện", "Người báo cáo", "Ngày tạo", "Ngày khắc phục", "Thời gian xử lý (giờ)"};

    private final BugReportHibernateDao bugReportDao;
    private final ProjectRepository projectRepository;

    public BugReportExportService(BugReportHibernateDao bugReportDao, ProjectRepository projectRepository) {
        this.bugReportDao = bugReportDao;
        this.projectRepository = projectRepository;
    }

    /** Định dạng hợp lệ: xlsx | csv (không phân biệt hoa thường). */
    public static String normalizeFormat(String format) {
        String f = format == null ? "xlsx" : format.trim().toLowerCase();
        if (!"xlsx".equals(f) && !"csv".equals(f)) {
            throw new BusinessException(ErrorCode.VALIDATION_ERROR, "Định dạng xuất không hỗ trợ, chỉ chấp nhận xlsx hoặc csv");
        }
        return f;
    }

    @Transactional(readOnly = true)
    public byte[] export(Long projectId, LocalDate from, LocalDate to, String format) {
        String f = normalizeFormat(format);
        BugReportResponse report = bugReportDao.generateBugReport(projectId, from, to);
        List<BugReportRowDto> rows = bugReportDao.listBugRows(projectId, report.getFrom(), report.getTo());
        Project project = projectRepository.findById(projectId).orElse(null);
        String projectLabel = project == null ? ("#" + projectId)
                : project.getName() + (project.getProjectKey() != null ? " (" + project.getProjectKey() + ")" : "");
        return "csv".equals(f) ? buildCsv(projectLabel, report, rows) : buildXlsx(projectLabel, report, rows);
    }

    // ------------------------------------------------------------------ nội dung chung

    private static String[][] summaryRows(BugReportResponse r) {
        return new String[][]{
                {"Tổng số lỗi", String.valueOf(r.getTotalBugs())},
                {"Đã khắc phục", String.valueOf(r.getResolvedBugs())},
                {"Chưa khắc phục", String.valueOf(r.getUnresolvedBugs())},
                {"Tỷ lệ xử lý (%)", trimNumber(r.getResolutionRate())},
                {"Thời gian đóng trung bình (giờ)", r.getAvgClosingTimeHours() == null ? "—" : trimNumber(r.getAvgClosingTimeHours())},
        };
    }

    private static String[][] infoRows(String projectLabel, BugReportResponse r) {
        return new String[][]{
                {"Dự án", projectLabel},
                {"Khoảng thời gian", fmtDate(r.getFrom()) + " – " + fmtDate(r.getTo())},
                {"Ngày xuất", LocalDateTime.now(VN).format(DATE_TIME)},
        };
    }

    private static String[] detailRow(BugReportRowDto b) {
        return new String[]{
                nz(b.getIssueKey()),
                nz(b.getSummary()),
                priorityLabel(b.getPriority()),
                nz(b.getStatusName()),
                b.isResolved() ? "Có" : "Chưa",
                b.getAssigneeName() == null || b.getAssigneeName().isBlank() ? "Chưa giao" : b.getAssigneeName(),
                nz(b.getReporterName()),
                fmtDateTime(b.getCreatedAt()),
                fmtDateTime(b.getResolvedAt()),
                b.getClosingHours() == null ? "" : trimNumber(b.getClosingHours()),
        };
    }

    static String priorityLabel(String p) {
        if (p == null) return "";
        String vi = PRIORITY_LABEL.get(p);
        return vi == null ? p : vi + " (" + p + ")";
    }

    /** Giờ lưu theo múi giờ máy chủ (Render = UTC) -> hiển thị giờ Việt Nam trong file. */
    private static String fmtDateTime(LocalDateTime t) {
        if (t == null) return "";
        return t.atZone(ZoneId.systemDefault()).withZoneSameInstant(VN).format(DATE_TIME);
    }

    private static String fmtDate(LocalDate d) { return d == null ? "" : d.format(DATE); }
    private static String nz(String s) { return s == null ? "" : s; }

    private static String trimNumber(double v) {
        return v == Math.rint(v) ? String.valueOf((long) v) : String.valueOf(v);
    }

    // ------------------------------------------------------------------ CSV

    byte[] buildCsv(String projectLabel, BugReportResponse report, List<BugReportRowDto> rows) {
        StringBuilder sb = new StringBuilder("﻿"); // BOM để Excel đọc đúng tiếng Việt
        line(sb, "BÁO CÁO LỖI (BUG) DỰ ÁN");
        for (String[] r : infoRows(projectLabel, report)) line(sb, r);
        sb.append("\n");
        line(sb, "CHỈ SỐ TỔNG HỢP", "GIÁ TRỊ");
        for (String[] r : summaryRows(report)) line(sb, r);
        sb.append("\n");
        line(sb, "LỖI THEO MỨC ĐỘ ƯU TIÊN", "Đã khắc phục", "Chưa khắc phục", "Tổng");
        for (BugReportItemDto i : report.getByPriority()) {
            line(sb, priorityLabel(i.getPriority()), String.valueOf(i.getResolved()), String.valueOf(i.getUnresolved()),
                    String.valueOf(i.getResolved() + i.getUnresolved()));
        }
        sb.append("\n");
        line(sb, "DANH SÁCH LỖI");
        line(sb, DETAIL_HEADERS);
        for (BugReportRowDto b : rows) line(sb, detailRow(b));
        return sb.toString().getBytes(StandardCharsets.UTF_8);
    }

    private static void line(StringBuilder sb, String... cells) {
        List<String> out = new ArrayList<>();
        for (String c : cells) {
            String v = ExportServiceImpl.sanitizeForSpreadsheet(c == null ? "" : c); // chống chèn công thức
            out.add("\"" + v.replace("\"", "\"\"") + "\"");
        }
        sb.append(String.join(",", out)).append("\n");
    }

    // ------------------------------------------------------------------ Excel

    byte[] buildXlsx(String projectLabel, BugReportResponse report, List<BugReportRowDto> rows) {
        try (Workbook wb = new XSSFWorkbook(); ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            ExcelStyleHelper st = new ExcelStyleHelper(wb);
            Sheet sh = wb.createSheet("Báo cáo lỗi");
            ExcelStyleHelper.prepareSheet(sh);
            int last = DETAIL_HEADERS.length - 1;
            int r = 0;

            Row title = sh.createRow(r++);
            title.setHeightInPoints(ExcelStyleHelper.TITLE_ROW_HEIGHT);
            cell(title, 0, "BÁO CÁO LỖI (BUG) DỰ ÁN", st.getTitleStyle());
            sh.addMergedRegion(new CellRangeAddress(0, 0, 0, last));

            for (String[] info : infoRows(projectLabel, report)) {
                Row row = sh.createRow(r++);
                row.setHeightInPoints(ExcelStyleHelper.INFO_ROW_HEIGHT);
                cell(row, 0, info[0], st.getInfoLabelStyle());
                cell(row, 1, info[1], st.getInfoValueStyle());
                sh.addMergedRegion(new CellRangeAddress(row.getRowNum(), row.getRowNum(), 1, 3));
            }
            r++;

            r = section(sh, st, r, "CHỈ SỐ TỔNG HỢP");
            Row h1 = sh.createRow(r++);
            h1.setHeightInPoints(ExcelStyleHelper.HEADER_ROW_HEIGHT);
            cell(h1, 0, "Chỉ số", st.getHeaderLeftStyle());
            cell(h1, 1, "Giá trị", st.getHeaderRightStyle());
            String[][] sum = summaryRows(report);
            for (int i = 0; i < sum.length; i++) {
                Row row = sh.createRow(r++);
                row.setHeightInPoints(ExcelStyleHelper.DATA_ROW_HEIGHT);
                cell(row, 0, sum[i][0], st.getDataLeftStyle(i % 2 == 1));
                cell(row, 1, sum[i][1], st.getDataRightStyle(i % 2 == 1));
            }
            r++;

            r = section(sh, st, r, "LỖI THEO MỨC ĐỘ ƯU TIÊN");
            Row h2 = sh.createRow(r++);
            h2.setHeightInPoints(ExcelStyleHelper.HEADER_ROW_HEIGHT);
            String[] h2Titles = {"Mức độ ưu tiên", "Đã khắc phục", "Chưa khắc phục", "Tổng"};
            for (int i = 0; i < h2Titles.length; i++) cell(h2, i, h2Titles[i], i == 0 ? st.getHeaderLeftStyle() : st.getHeaderRightStyle());
            List<BugReportItemDto> byP = report.getByPriority();
            for (int i = 0; i < byP.size(); i++) {
                BugReportItemDto it = byP.get(i);
                boolean z = i % 2 == 1;
                Row row = sh.createRow(r++);
                row.setHeightInPoints(ExcelStyleHelper.DATA_ROW_HEIGHT);
                cell(row, 0, priorityLabel(it.getPriority()), st.getDataLeftStyle(z));
                num(row, 1, it.getResolved(), st.getDataIntegerStyle(z));
                num(row, 2, it.getUnresolved(), st.getDataIntegerStyle(z));
                num(row, 3, it.getResolved() + it.getUnresolved(), st.getDataIntegerStyle(z));
            }
            r++;

            r = section(sh, st, r, "DANH SÁCH LỖI (" + rows.size() + ")");
            Row h3 = sh.createRow(r++);
            h3.setHeightInPoints(ExcelStyleHelper.HEADER_ROW_HEIGHT);
            for (int i = 0; i < DETAIL_HEADERS.length; i++) cell(h3, i, DETAIL_HEADERS[i], st.getHeaderCenterStyle());
            for (int i = 0; i < rows.size(); i++) {
                boolean z = i % 2 == 1;
                String[] d = detailRow(rows.get(i));
                Row row = sh.createRow(r++);
                row.setHeightInPoints(ExcelStyleHelper.DATA_ROW_HEIGHT);
                for (int c = 0; c < d.length; c++) {
                    CellStyle s = (c == 1 || c == 5 || c == 6) ? st.getDataLeftStyle(z)
                            : (c == last ? st.getDataRightStyle(z) : st.getDataCenterStyle(z));
                    cell(row, c, d[c], s);
                }
            }

            ExcelStyleHelper.formatColumns(sh, new int[]{14, 40, 18, 16, 14, 22, 22, 18, 18, 18}, 60);
            wb.write(out);
            return out.toByteArray();
        } catch (Exception e) {
            throw new RuntimeException("Không thể tạo file Excel báo cáo lỗi: " + e.getMessage(), e);
        }
    }

    private static int section(Sheet sh, ExcelStyleHelper st, int r, String text) {
        Row row = sh.createRow(r);
        row.setHeightInPoints(ExcelStyleHelper.SECTION_ROW_HEIGHT);
        cell(row, 0, text, st.getSectionHeaderStyle());
        return r + 1;
    }

    private static void cell(Row row, int col, String value, CellStyle style) {
        Cell c = row.createCell(col);
        c.setCellValue(ExportServiceImpl.sanitizeForSpreadsheet(value == null ? "" : value));
        c.setCellStyle(style);
    }

    private static void num(Row row, int col, double value, CellStyle style) {
        Cell c = row.createCell(col);
        c.setCellValue(value);
        c.setCellStyle(style);
    }
}
