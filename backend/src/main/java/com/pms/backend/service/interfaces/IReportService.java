package com.pms.backend.service.interfaces;

import com.pms.backend.dto.*;
import com.pms.backend.model.User;

import java.time.LocalDate;

public interface IReportService {
    ProgressReportResponse getProgressReport(Long projectId, LocalDate from, LocalDate to, String metric);
    ProductivityReportResponse getProductivityReport(Long projectId, LocalDate from, LocalDate to);
    ProductivityReportResponse getProductivityReport(Long projectId, ProductivityFilterRequest filter);
    MemberDetailProductivityResponse getMemberProductivityDetail(Long projectId, Long userId, ProductivityFilterRequest filter);
    byte[] exportProductivityReport(Long projectId, ProductivityFilterRequest filter, User currentUser);
    byte[] exportProductivityReport(Long projectId, ProductivityFilterRequest filter, User currentUser, String format);
    BugReportResponse getBugReport(Long projectId, LocalDate from, LocalDate to);
    ReportResponse generateProjectReport(Long projectId);
}
