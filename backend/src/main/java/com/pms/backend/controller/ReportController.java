package com.pms.backend.controller;

import com.pms.backend.common.ApiResponse;
import com.pms.backend.dto.*;
import com.pms.backend.model.User;
import com.pms.backend.service.interfaces.IReportService;
import com.pms.backend.service.interfaces.IUserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;

@RestController
public class ReportController {

    private final IReportService reportService;
    private final IUserService userService;

    public ReportController(IReportService reportService) {
        this(reportService, null);
    }

    @Autowired
    public ReportController(IReportService reportService, IUserService userService) {
        this.reportService = reportService;
        this.userService = userService;
    }

    private User getCurrentUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated() || "anonymousUser".equals(auth.getName())) {
            return null;
        }
        return userService != null ? userService.getUserByEmail(auth.getName()) : null;
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
    @PreAuthorize("@projectSecurity.isPmOrAdmin(#projectId)")
    public ApiResponse<ProductivityReportResponse> getProductivityReport(
            @PathVariable Long projectId,
            @ModelAttribute ProductivityFilterRequest filter) {
        return ApiResponse.success(reportService.getProductivityReport(projectId, filter));
    }

    @GetMapping({"/api/projects/{projectId}/reports/productivity/members/{userId}", "/projects/{projectId}/reports/productivity/members/{userId}"})
    @PreAuthorize("@projectSecurity.isPmOrAdmin(#projectId)")
    public ApiResponse<MemberDetailProductivityResponse> getMemberProductivityDetail(
            @PathVariable Long projectId,
            @PathVariable Long userId,
            @ModelAttribute ProductivityFilterRequest filter) {
        return ApiResponse.success(reportService.getMemberProductivityDetail(projectId, userId, filter));
    }

    @GetMapping({"/api/projects/{projectId}/reports/productivity/export", "/projects/{projectId}/reports/productivity/export"})
    @PreAuthorize("@projectSecurity.isPmOrAdmin(#projectId)")
    public ResponseEntity<byte[]> exportProductivityReport(
            @PathVariable Long projectId,
            @ModelAttribute ProductivityFilterRequest filter) {
        User currentUser = getCurrentUser();
        byte[] data = reportService.exportProductivityReport(projectId, filter, currentUser);
        String filename = "productivity-report-" + projectId + "-" + LocalDate.now() + ".xlsx";

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
                .contentType(MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
                .body(data);
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
