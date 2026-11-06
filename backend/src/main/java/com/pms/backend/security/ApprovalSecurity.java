package com.pms.backend.security;

import com.pms.backend.dao.AppAdminRepository;
import com.pms.backend.dao.ProjectMemberRepository;
import com.pms.backend.enu.ProjectRole;
import org.springframework.stereotype.Component;

@Component("approvalSecurity")
public class ApprovalSecurity {

    private final ProjectSecurity projectSecurity;
    private final ProjectMemberRepository memberRepository;
    private final AppAdminRepository appAdminRepository;

    public ApprovalSecurity(ProjectSecurity projectSecurity,
                             ProjectMemberRepository memberRepository,
                             AppAdminRepository appAdminRepository) {
        this.projectSecurity = projectSecurity;
        this.memberRepository = memberRepository;
        this.appAdminRepository = appAdminRepository;
    }

    public boolean isPmOnProject(Long projectId) {
        if (projectId == null) return false;
        AuthUserPrincipal user = projectSecurity.getCurrentUser();
        if (user == null) return false;
        return memberRepository.findByProjectIdAndUserId(projectId, user.getId())
                .map(m -> m.getRole() == ProjectRole.PM)
                .orElse(false);
    }

    public boolean isAdmin() {
        AuthUserPrincipal user = projectSecurity.getCurrentUser();
        if (user == null) return false;
        return appAdminRepository.existsByUserId(user.getId());
    }

    public boolean isMemberOrAdmin(Long projectId) {
        if (projectId == null) return false;
        AuthUserPrincipal user = projectSecurity.getCurrentUser();
        if (user == null) return false;
        boolean admin = appAdminRepository.existsByUserId(user.getId());
        boolean member = memberRepository.existsByProjectIdAndUserId(projectId, user.getId());
        return admin || member;
    }

    public boolean canCreateRequest(Long projectId) {
        if (projectId == null) return false;
        return isPmOnProject(projectId) || isAdmin();
    }
}
