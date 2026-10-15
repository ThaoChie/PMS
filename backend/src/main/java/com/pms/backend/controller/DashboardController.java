package com.pms.backend.controller;

import com.pms.backend.common.ApiResponse;
import com.pms.backend.dto.DashboardResponse;
import com.pms.backend.model.User;
import com.pms.backend.service.DashboardService;
import com.pms.backend.service.UserService;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping({"/api/dashboard", "/dashboard"})
@PreAuthorize("isAuthenticated()")
public class DashboardController {

    private final DashboardService dashboardService;
    private final UserService userService;

    public DashboardController(DashboardService dashboardService, UserService userService) {
        this.dashboardService = dashboardService;
        this.userService = userService;
    }

    private User getCurrentUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        return userService.getUserByEmail(auth.getName());
    }

    @GetMapping
    public ApiResponse<DashboardResponse> getDashboard() {
        return ApiResponse.success(dashboardService.getDashboard(getCurrentUser()));
    }
}
