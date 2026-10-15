package com.pms.backend.controller;

import com.pms.backend.common.ApiResponse;
import com.pms.backend.dto.BugReportItemDto;
import com.pms.backend.dto.ProductivityPointDto;
import com.pms.backend.dto.ProgressPointDto;
import com.pms.backend.dto.ReportResponse;
import com.pms.backend.service.ReportService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
public class ReportController {

    private final ReportService reportService;

    public ReportController(ReportService reportService) {
        this.reportService = reportService;
    }

    @GetMapping({"/api/reports/project/{projectId}", "/reports/project/{projectId}"})
    public ApiResponse<ReportResponse> getProjectReport(@PathVariable Long projectId) {
        return ApiResponse.success(reportService.generateProjectReport(projectId));
    }

    @GetMapping({"/api/projects/{projectId}/reports/progress", "/projects/{projectId}/reports/progress"})
    public ApiResponse<List<ProgressPointDto>> getProgressReport(@PathVariable Long projectId) {
        return ApiResponse.success(reportService.getProgressReport(projectId));
    }

    @GetMapping({"/api/projects/{projectId}/reports/productivity", "/projects/{projectId}/reports/productivity"})
    public ApiResponse<List<ProductivityPointDto>> getProductivityReport(@PathVariable Long projectId) {
        return ApiResponse.success(reportService.getProductivityReport(projectId));
    }

    @GetMapping({"/api/projects/{projectId}/reports/bugs", "/projects/{projectId}/reports/bugs"})
    public ApiResponse<List<BugReportItemDto>> getBugReport(@PathVariable Long projectId) {
        return ApiResponse.success(reportService.getBugReport(projectId));
    }
}
