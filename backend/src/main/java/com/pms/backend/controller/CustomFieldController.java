package com.pms.backend.controller;

import com.pms.backend.common.ApiResponse;
import com.pms.backend.dto.CreateCustomFieldRequest;
import com.pms.backend.dto.CustomFieldDto;
import com.pms.backend.dto.UpdateCustomFieldRequest;
import com.pms.backend.model.User;
import com.pms.backend.service.interfaces.ICustomFieldService;
import com.pms.backend.service.interfaces.IUserService;
import jakarta.validation.Valid;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
public class CustomFieldController {

    private final ICustomFieldService customFieldService;
    private final IUserService userService;

    public CustomFieldController(ICustomFieldService customFieldService, IUserService userService) {
        this.customFieldService = customFieldService;
        this.userService = userService;
    }

    private User getCurrentUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        return userService.getUserByEmail(auth.getName());
    }

    @GetMapping({"/api/projects/{projectId}/custom-fields", "/projects/{projectId}/custom-fields"})
    @PreAuthorize("@projectSecurity.isMember(#projectId)")
    public ApiResponse<List<CustomFieldDto>> getProjectCustomFields(@PathVariable Long projectId) {
        return ApiResponse.success(customFieldService.getCustomFields(projectId));
    }

    @PostMapping({"/api/projects/{projectId}/custom-fields", "/projects/{projectId}/custom-fields"})
    @PreAuthorize("@projectSecurity.canManageCustomFields(#projectId)")
    public ApiResponse<CustomFieldDto> createCustomField(
            @PathVariable Long projectId,
            @Valid @RequestBody CreateCustomFieldRequest request
    ) {
        return ApiResponse.success(customFieldService.createCustomField(projectId, request, getCurrentUser()));
    }

    @PutMapping({"/api/projects/{projectId}/custom-fields/{fieldId}", "/projects/{projectId}/custom-fields/{fieldId}"})
    @PreAuthorize("@projectSecurity.canManageCustomFields(#projectId)")
    public ApiResponse<CustomFieldDto> updateCustomField(
            @PathVariable Long projectId,
            @PathVariable Long fieldId,
            @Valid @RequestBody UpdateCustomFieldRequest request
    ) {
        return ApiResponse.success(customFieldService.updateCustomField(projectId, fieldId, request, getCurrentUser()));
    }

    @DeleteMapping({"/api/projects/{projectId}/custom-fields/{fieldId}", "/projects/{projectId}/custom-fields/{fieldId}"})
    @PreAuthorize("@projectSecurity.canManageCustomFields(#projectId)")
    public ApiResponse<Void> deleteCustomField(
            @PathVariable Long projectId,
            @PathVariable Long fieldId
    ) {
        customFieldService.deleteCustomField(projectId, fieldId, getCurrentUser());
        return ApiResponse.success(null);
    }
}
