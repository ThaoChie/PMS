package com.pms.backend.service;

import com.pms.backend.dto.BugReportItemDto;
import com.pms.backend.dto.BugReportResponse;
import com.pms.backend.dto.BugReportRowDto;
import com.pms.backend.exception.BusinessException;
import com.pms.backend.hibernateDao.BugReportHibernateDao;
import com.pms.backend.dao.ProjectRepository;
import com.pms.backend.model.Project;
import com.pms.backend.service.impl.BugReportExportService;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.io.ByteArrayInputStream;
import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

/** File xuất của tab Báo cáo lỗi phải chứa NỘI DUNG BÁO CÁO LỖI, không phải danh sách công việc / burndown. */
@ExtendWith(MockitoExtension.class)
class BugReportExportServiceTest {

    @Mock private BugReportHibernateDao dao;
    @Mock private ProjectRepository projectRepository;
    @InjectMocks private BugReportExportService service;

    private final LocalDate from = LocalDate.of(2026, 10, 26);
    private final LocalDate to = LocalDate.of(2026, 11, 25);

    @BeforeEach
    void setup() {
        BugReportResponse report = new BugReportResponse(1L, from, to, 3, 1, 2, 33.3, 5.5,
                List.of(new BugReportItemDto("HIGHEST", 0, 1), new BugReportItemDto("HIGH", 1, 1)),
                Map.of("HIGHEST", 1, "HIGH", 1));
        List<BugReportRowDto> rows = List.of(
                new BugReportRowDto("PRJ-5", "Không tải được tệp", "HIGHEST", "To Do", false, "Priya", "Alex",
                        LocalDateTime.of(2026, 11, 20, 9, 0), null, null),
                new BugReportRowDto("PRJ-7", "=HYPERLINK(\"http://x\")", "HIGH", "In Progress", false, "", "Alex",
                        LocalDateTime.of(2026, 11, 21, 9, 0), null, null),
                new BugReportRowDto("PRJ-3", "Sai mốc thời gian", "HIGH", "Done", true, "Marcus", "Alex",
                        LocalDateTime.of(2026, 11, 1, 8, 0), LocalDateTime.of(2026, 11, 1, 13, 30), 5.5));
        // lenient: ca kiểm tra định dạng không gọi tới dữ liệu này
        lenient().when(dao.generateBugReport(eq(1L), any(), any())).thenReturn(report);
        lenient().when(dao.listBugRows(eq(1L), any(), any())).thenReturn(rows);
        Project p = new Project();
        p.setName("Demo");
        p.setProjectKey("PRJ");
        lenient().when(projectRepository.findById(1L)).thenReturn(Optional.of(p));
    }

    @Test
    void csv_chuaDungNoiDungBaoCaoLoi() {
        String csv = new String(service.export(1L, from, to, "csv"), StandardCharsets.UTF_8);
        assertTrue(csv.startsWith("﻿"), "co BOM de Excel doc tieng Viet");
        assertTrue(csv.contains("BÁO CÁO LỖI (BUG) DỰ ÁN"));
        assertTrue(csv.contains("\"Dự án\",\"Demo (PRJ)\""));
        assertTrue(csv.contains("\"Tổng số lỗi\",\"3\""));
        assertTrue(csv.contains("\"Tỷ lệ xử lý (%)\",\"33.3\""));
        assertTrue(csv.contains("\"Khẩn cấp nhất (HIGHEST)\",\"0\",\"1\",\"1\""));
        assertTrue(csv.contains("\"PRJ-5\",\"Không tải được tệp\""));
        assertTrue(csv.contains("\"PRJ-3\",\"Sai mốc thời gian\",\"Cao (HIGH)\",\"Done\",\"Có\""));
        assertTrue(csv.contains("\"Chưa giao\""), "nguoi thuc hien trong -> Chua giao");
        assertTrue(csv.contains("\"'=HYPERLINK"), "chong chen cong thuc");
        assertFalse(csv.contains("Burn"), "khong phai noi dung burndown");
    }

    @Test
    void xlsx_mo_duoc_va_co_du_3_phan() throws Exception {
        byte[] bytes = service.export(1L, from, to, "XLSX");
        try (Workbook wb = new XSSFWorkbook(new ByteArrayInputStream(bytes))) {
            Sheet sh = wb.getSheetAt(0);
            assertEquals("Báo cáo lỗi", sh.getSheetName());
            StringBuilder all = new StringBuilder();
            for (Row r : sh) for (Cell c : r) all.append(c.toString()).append('|');
            String text = all.toString();
            assertTrue(text.contains("BÁO CÁO LỖI (BUG) DỰ ÁN"));
            assertTrue(text.contains("CHỈ SỐ TỔNG HỢP"));
            assertTrue(text.contains("LỖI THEO MỨC ĐỘ ƯU TIÊN"));
            assertTrue(text.contains("DANH SÁCH LỖI (3)"));
            assertTrue(text.contains("PRJ-5") && text.contains("PRJ-7") && text.contains("PRJ-3"));
            assertTrue(text.contains("Thời gian xử lý (giờ)"));
        }
    }

    @Test
    void dinhDangKhongHoTro_bao400() {
        assertThrows(BusinessException.class, () -> BugReportExportService.normalizeFormat("pdf"));
        assertEquals("csv", BugReportExportService.normalizeFormat(" CSV "));
    }
}
