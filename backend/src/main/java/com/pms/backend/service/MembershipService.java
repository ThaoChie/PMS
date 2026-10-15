package com.pms.backend.service;

import com.pms.backend.dao.ProjectMemberRepository;
import com.pms.backend.dao.ProjectRepository;
import com.pms.backend.dto.MemberResponse;
import com.pms.backend.enu.ErrorCode;
import com.pms.backend.enu.ProjectRole;
import com.pms.backend.exception.BusinessException;
import com.pms.backend.exception.ResourceNotFoundException;
import com.pms.backend.model.ProjectMember;
import com.pms.backend.security.ProjectSecurity;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class MembershipService {

    private final ProjectMemberRepository memberRepository;
    private final ProjectRepository projectRepository;
    private final AuditService auditService;
    private final ProjectSecurity projectSecurity;

    public MembershipService(ProjectMemberRepository memberRepository,
                             ProjectRepository projectRepository,
                             AuditService auditService,
                             ProjectSecurity projectSecurity) {
        this.memberRepository = memberRepository;
        this.projectRepository = projectRepository;
        this.auditService = auditService;
        this.projectSecurity = projectSecurity;
    }

    public List<MemberResponse> getMembers(Long projectId) {
        if (!projectRepository.existsById(projectId)) {
            throw new ResourceNotFoundException("Không tìm thấy dự án: " + projectId);
        }
        return memberRepository.findByProjectId(projectId).stream()
                .map(MemberResponse::from)
                .collect(Collectors.toList());
    }

    @Transactional
    public void changeMemberRole(Long projectId, Long userId, ProjectRole newRole) {
        projectSecurity.assertProjectWritable(projectId);

        ProjectMember member = memberRepository.findByProjectIdAndUserId(projectId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Thành viên không tồn tại trong dự án"));

        ProjectRole oldRole = member.getRole();
        if (oldRole == ProjectRole.PM && newRole != ProjectRole.PM) {
            long pmCount = memberRepository.countByProjectIdAndRole(projectId, ProjectRole.PM);
            if (pmCount <= 1) {
                throw new BusinessException(ErrorCode.LAST_PM_REMOVAL, "Không thể hạ vai trò của Project Manager duy nhất trong dự án");
            }
        }

        member.setRole(newRole);
        memberRepository.save(member);

        auditService.log("CHANGE_ROLE", "PROJECT_MEMBER", member.getId(), projectId, oldRole.name(), newRole.name());
    }

    @Transactional
    public void removeMember(Long projectId, Long userId) {
        projectSecurity.assertProjectWritable(projectId);

        ProjectMember member = memberRepository.findByProjectIdAndUserId(projectId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Thành viên không tồn tại trong dự án"));

        if (member.getRole() == ProjectRole.PM) {
            long pmCount = memberRepository.countByProjectIdAndRole(projectId, ProjectRole.PM);
            if (pmCount <= 1) {
                throw new BusinessException(ErrorCode.LAST_PM_REMOVAL, "Không thể xóa Project Manager duy nhất khỏi dự án");
            }
        }

        memberRepository.delete(member);
        auditService.log("REMOVE_MEMBER", "PROJECT_MEMBER", member.getId(), projectId, member.getRole().name(), null);
    }
}
