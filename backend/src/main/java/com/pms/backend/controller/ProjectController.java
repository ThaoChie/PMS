package com.pms.backend.controller;

import com.pms.backend.common.ApiResponse;
import com.pms.backend.dto.CreateProjectRequest;
import com.pms.backend.dto.ProjectResponse;
import com.pms.backend.dto.UpdateProjectRequest;
import com.pms.backend.model.User;
import com.pms.backend.security.AuthUserPrincipal;
import com.pms.backend.service.interfaces.IProjectService;
import com.pms.backend.service.interfaces.IUserService;
import com.pms.backend.wrapper.PageWrapper;
import jakarta.validation.Valid;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping({"/api/projects", "/projects"})
public class ProjectController {

    private final IProjectService projectService;
    private final IUserService userService;

    public ProjectController(IProjectService projectService, IUserService userService) {
        this.projectService = projectService;
        this.userService = userService;
    }

    private AuthUserPrincipal getAuthPrincipal() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.getPrincipal() instanceof AuthUserPrincipal principal) {
            return principal;
        }
        throw new IllegalStateException("User not authenticated");
    }

    @PostMapping
    @PreAuthorize("isAuthenticated()")
    public ApiResponse<ProjectResponse> createProject(@Valid @RequestBody CreateProjectRequest request) {
        AuthUserPrincipal principal = getAuthPrincipal();
        User creator = userService.getUserById(principal.getId());
        ProjectResponse response = projectService.createProject(request, creator);
        return ApiResponse.success(response);
    }

    @GetMapping
    @PreAuthorize("isAuthenticated()")
    public ApiResponse<PageWrapper<ProjectResponse>> getProjects(
            @RequestParam(required = false) String q,
            @RequestParam(required = false) String sort,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        AuthUserPrincipal principal = getAuthPrincipal();
        PageWrapper<ProjectResponse> response = projectService.getProjects(
                principal.getId(), q, sort, page, size
        );
        return ApiResponse.success(response);
    }

    @GetMapping("/{id}")
    @PreAuthorize("@projectSecurity.isMember(#id)")
    public ApiResponse<ProjectResponse> getProjectById(@PathVariable Long id) {
        return ApiResponse.success(projectService.getProjectById(id));
    }

    @PutMapping("/{id}")
    @PreAuthorize("@projectSecurity.isPmOrAdmin(#id)")
    public ApiResponse<ProjectResponse> updateProject(@PathVariable Long id,
                                                      @Valid @RequestBody UpdateProjectRequest request) {
        return ApiResponse.success(projectService.updateProject(id, request));
    }

    @PutMapping("/{id}/permissions")
    @PreAuthorize("@projectSecurity.isPmOrAdmin(#id)")
    public ApiResponse<ProjectResponse> updateProjectPermissions(@PathVariable Long id,
                                                                 @RequestBody com.pms.backend.dto.ProjectPermissionsRequest request) {
        return ApiResponse.success(projectService.updateProjectPermissions(id, request));
    }

    @PostMapping("/{id}/close")
    @PreAuthorize("@projectSecurity.isPmOrAdmin(#id)")
    public ApiResponse<ProjectResponse> closeProject(@PathVariable Long id) {
        return ApiResponse.success(projectService.closeProject(id));
    }

    @GetMapping("/suggest-key")
    @PreAuthorize("isAuthenticated()")
    public ApiResponse<Map<String, String>> suggestProjectKey(@RequestParam(defaultValue = "") String name) {
        String key = projectService.suggestProjectKey(name);
        return ApiResponse.success(Map.of("suggestedKey", key));
    }

    @GetMapping("/check-key")
    @PreAuthorize("isAuthenticated()")
    public ApiResponse<Map<String, Object>> checkProjectKey(@RequestParam(defaultValue = "") String key) {
        boolean available = projectService.isProjectKeyAvailable(key);
        String suggested = available ? key : projectService.suggestProjectKey(key);
        return ApiResponse.success(Map.of(
                "available", available,
                "suggestedKey", suggested
        ));
    }
}
