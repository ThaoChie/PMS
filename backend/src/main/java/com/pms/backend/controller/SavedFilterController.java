package com.pms.backend.controller;

import com.pms.backend.common.ApiResponse;
import com.pms.backend.dto.CreateFilterRequest;
import com.pms.backend.dto.SavedFilterResponse;
import com.pms.backend.dto.ShareFilterRequest;
import com.pms.backend.dto.SubscriptionRequest;
import com.pms.backend.model.User;
import com.pms.backend.service.SavedFilterService;
import com.pms.backend.service.UserService;
import jakarta.validation.Valid;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping({"/api/filters", "/filters"})
@PreAuthorize("isAuthenticated()")
public class SavedFilterController {

    private final SavedFilterService savedFilterService;
    private final UserService userService;

    public SavedFilterController(SavedFilterService savedFilterService, UserService userService) {
        this.savedFilterService = savedFilterService;
        this.userService = userService;
    }

    private User getCurrentUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        return userService.getUserByEmail(auth.getName());
    }

    @GetMapping
    public ApiResponse<List<SavedFilterResponse>> getAccessibleFilters() {
        return ApiResponse.success(savedFilterService.getAccessibleFilters(getCurrentUser()));
    }

    @GetMapping("/{id}")
    public ApiResponse<SavedFilterResponse> getFilterById(@PathVariable Long id) {
        return ApiResponse.success(savedFilterService.getFilterById(id, getCurrentUser()));
    }

    @PostMapping
    public ApiResponse<SavedFilterResponse> createFilter(@Valid @RequestBody CreateFilterRequest request) {
        return ApiResponse.success(savedFilterService.createFilter(request, getCurrentUser()));
    }

    @PutMapping("/{id}")
    public ApiResponse<SavedFilterResponse> updateFilter(@PathVariable Long id, @RequestBody CreateFilterRequest request) {
        return ApiResponse.success(savedFilterService.updateFilter(id, request, getCurrentUser()));
    }

    @DeleteMapping("/{id}")
    public ApiResponse<Void> deleteFilter(@PathVariable Long id) {
        savedFilterService.deleteFilter(id, getCurrentUser());
        return ApiResponse.success(null);
    }

    @PostMapping("/{id}/share")
    public ApiResponse<Void> shareFilter(@PathVariable Long id, @RequestBody ShareFilterRequest request) {
        savedFilterService.shareFilter(id, request.getUserIds(), getCurrentUser());
        return ApiResponse.success(null);
    }

    @PutMapping("/{id}/subscription")
    public ApiResponse<Void> updateSubscription(@PathVariable Long id, @Valid @RequestBody SubscriptionRequest request) {
        savedFilterService.updateSubscription(id, request.getFrequency(), getCurrentUser());
        return ApiResponse.success(null);
    }

    @DeleteMapping("/{id}/subscription")
    public ApiResponse<Void> cancelSubscription(@PathVariable Long id) {
        savedFilterService.cancelSubscription(id, getCurrentUser());
        return ApiResponse.success(null);
    }
}
