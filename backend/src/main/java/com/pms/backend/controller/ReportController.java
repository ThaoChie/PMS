package com.pms.backend.controller;

import com.pms.backend.common.ApiResponse;
import com.pms.backend.dto.*;
import com.pms.backend.service.ReportService;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;

@RestController
public class ReportController {

    private final ReportService reportService;

    public ReportController(ReportService reportService) {
        this.reportService = reportService;
    }

    @GetMapping({"/api/reports/project/{projectId}", "/reports/project/{projectId}"})
    @PreAuthorize("@projectSecurity.isMember(#projectId)")
    public ApiResponse<ReportResponse> getProjectReport(@PathVariable Long projectId) {
        return ApiResponse.success(reportService.generateProjectReport(projectId));
    }

    @GetMapping({"/api/projects/{projectId}/reports/progress", "/projects/{projectId}/reports/progress"})
    @PreAuthorize("@projectSecurity.isMember(#projectId)")
    public ApiResponse<ProgressReportResponse> getProgressReport(
            @PathVariable Long projectId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
            @RequestParam(required = false, defaultValue = "issues") String metric) {
        return ApiResponse.success(reportService.getProgressReport(projectId, from, to, metric));
    }

    @GetMapping({"/api/projects/{projectId}/reports/productivity", "/projects/{projectId}/reports/productivity"})
    @PreAuthorize("@projectSecurity.isMember(#projectId)")
    public ApiResponse<ProductivityReportResponse> getProductivityReport(
            @PathVariable Long projectId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        return ApiResponse.success(reportService.getProductivityReport(projectId, from, to));
    }

    @GetMapping({"/api/projects/{projectId}/reports/bugs", "/projects/{projectId}/reports/bugs"})
    @PreAuthorize("@projectSecurity.hasRole(#projectId, 'PM', 'QA')")
    public ApiResponse<BugReportResponse> getBugReport(
            @PathVariable Long projectId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        return ApiResponse.success(reportService.getBugReport(projectId, from, to));
    }
}
