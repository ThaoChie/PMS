package com.pms.backend.service.interfaces;

import com.pms.backend.dto.CreateProjectRequest;
import com.pms.backend.dto.ProjectResponse;
import com.pms.backend.dto.UpdateProjectRequest;
import com.pms.backend.model.Project;
import com.pms.backend.model.User;
import com.pms.backend.wrapper.PageWrapper;

public interface IProjectService {
    ProjectResponse createProject(CreateProjectRequest request, User creator);
    PageWrapper<ProjectResponse> getProjects(Long userId, String q, String sort, int page, int size);
    ProjectResponse getProjectById(Long projectId);
    ProjectResponse updateProject(Long projectId, UpdateProjectRequest request);
    ProjectResponse updateProjectPermissions(Long projectId, com.pms.backend.dto.ProjectPermissionsRequest request);
    ProjectResponse closeProject(Long projectId);
    Project createProject(Project project, String creatorEmail);
    String suggestProjectKey(String name);
    boolean isProjectKeyAvailable(String key);
}
