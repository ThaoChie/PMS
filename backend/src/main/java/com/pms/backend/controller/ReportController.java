package com.pms.backend.controller;

import com.pms.backend.common.ApiResponse;
import com.pms.backend.dto.ReportResponse;
import com.pms.backend.service.ReportService;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/reports")
public class ReportController {

    private final ReportService reportService;

    public ReportController(ReportService reportService) {
        this.reportService = reportService;
    }

    @GetMapping("/project/{projectId}")
    public ApiResponse<ReportResponse> getProjectReport(@PathVariable Long projectId) {
        return ApiResponse.success(reportService.generateProjectReport(projectId));
    }
}
