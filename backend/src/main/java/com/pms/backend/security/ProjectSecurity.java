package com.pms.backend.security;

import com.pms.backend.dao.ProjectMemberRepository;
import com.pms.backend.dao.ProjectRepository;
import com.pms.backend.enu.ErrorCode;
import com.pms.backend.enu.ProjectRole;
import com.pms.backend.enu.ProjectStatus;
import com.pms.backend.exception.BusinessException;
import com.pms.backend.exception.ResourceNotFoundException;
import com.pms.backend.model.Project;
import com.pms.backend.model.ProjectMember;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

import java.util.Arrays;
import java.util.Optional;

@Component("projectSecurity")
public class ProjectSecurity {

    private final ProjectMemberRepository projectMemberRepository;
    private final ProjectRepository projectRepository;

    public ProjectSecurity(ProjectMemberRepository projectMemberRepository, ProjectRepository projectRepository) {
        this.projectMemberRepository = projectMemberRepository;
        this.projectRepository = projectRepository;
    }

    public AuthUserPrincipal getCurrentUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.getPrincipal() instanceof AuthUserPrincipal principal) {
            return principal;
        }
        return null;
    }
    // Kểm tra xem người dùng có phải là thành viên của dự án không
    public boolean isMember(Long projectId) {
        AuthUserPrincipal user = getCurrentUser();
        if (user == null) {
            return false;
        } 
        
        return projectMemberRepository.existsByProjectIdAndUserId(projectId, user.getId());
    }
    // Kiem tra xem người dùng có vai trò cụ thể trong dự án không
    public boolean hasRole(Long projectId, String... roles) {
        AuthUserPrincipal user = getCurrentUser();
        if (user == null) {
            return false;
        }
        

        Optional<ProjectMember> memberOpt = projectMemberRepository.findByProjectIdAndUserId(projectId, user.getId());
        if (memberOpt.isEmpty()) {
            return false;
        }

        ProjectRole userRole = memberOpt.get().getRole();
        return Arrays.stream(roles).anyMatch(r -> r.equalsIgnoreCase(userRole.name()));
    }
    // Kiem tra xem người dùng có vai trò PM
    public boolean isPmOrAdmin(Long projectId) {
        return hasRole(projectId, "PM");
    }

    public boolean canManageCustomFields(Long projectId) {
        if (isPmOrAdmin(projectId)) return true;
        if (!isMember(projectId)) return false;
        return projectRepository.findById(projectId)
                .map(p -> Boolean.TRUE.equals(p.getAllowMemberManageCustomFields()))
                .orElse(false);
    }

    public void assertProjectWritable(Long projectId) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy dự án với ID: " + projectId));

        assertProjectWritable(project);
    }

    public void assertProjectWritable(Project project) {
        if (project == null) return;
        if (project.getStatus() == ProjectStatus.CLOSED) {
            throw new BusinessException(ErrorCode.PROJECT_CLOSED, "Dự án đã đóng (CLOSED), không thể tạo mới hoặc sửa đổi");
        }
    }
}
