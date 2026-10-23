package com.pms.backend.service.interfaces;

import com.pms.backend.dto.BugReportResponse;
import com.pms.backend.dto.ProductivityReportResponse;
import com.pms.backend.dto.ProgressReportResponse;
import com.pms.backend.dto.ReportResponse;

import java.time.LocalDate;

public interface IReportService {
    ProgressReportResponse getProgressReport(Long projectId, LocalDate from, LocalDate to, String metric);
    ProductivityReportResponse getProductivityReport(Long projectId, LocalDate from, LocalDate to);
    BugReportResponse getBugReport(Long projectId, LocalDate from, LocalDate to);
    ReportResponse generateProjectReport(Long projectId);
}
