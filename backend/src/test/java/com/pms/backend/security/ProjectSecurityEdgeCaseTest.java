package com.pms.backend.security;

import com.pms.backend.dao.ProjectMemberRepository;
import com.pms.backend.dao.ProjectRepository;
import com.pms.backend.enu.ProjectRole;
import com.pms.backend.enu.ProjectStatus;
import com.pms.backend.exception.BusinessException;
import com.pms.backend.model.Project;
import com.pms.backend.model.ProjectMember;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class ProjectSecurityEdgeCaseTest {

    @Mock
    private ProjectMemberRepository memberRepository;

    @Mock
    private ProjectRepository projectRepository;

    @InjectMocks
    private ProjectSecurity projectSecurity;

    private Project activeProject;
    private Project closedProject;

    @BeforeEach
    public void setup() {
        activeProject = new Project();
        activeProject.setId(1L);
        activeProject.setStatus(ProjectStatus.ACTIVE);
        activeProject.setAllowMemberManageCustomFields(false);

        closedProject = new Project();
        closedProject.setId(2L);
        closedProject.setStatus(ProjectStatus.CLOSED);
    }

    @AfterEach
    public void cleanup() {
        SecurityContextHolder.clearContext();
    }

    private void mockAuthUser(Long userId, String email) {
        AuthUserPrincipal principal = new AuthUserPrincipal(
                userId, email, "", true, List.of(new SimpleGrantedAuthority("ROLE_USER"))
        );
        UsernamePasswordAuthenticationToken auth = new UsernamePasswordAuthenticationToken(
                principal, null, principal.getAuthorities()
        );
        SecurityContextHolder.getContext().setAuthentication(auth);
    }

    @Test
    public void testAssertProjectWritable_WhenClosed_ThrowsBusinessException() {
        assertThrows(BusinessException.class, () -> {
            projectSecurity.assertProjectWritable(closedProject);
        });
    }

    @Test
    public void testAssertProjectWritable_WhenActive_Passes() {
        assertDoesNotThrow(() -> {
            projectSecurity.assertProjectWritable(activeProject);
        });
    }

    @Test
    public void testCanManageCustomFields_WhenPM_ReturnsTrue() {
        mockAuthUser(10L, "pm@epms.com");

        ProjectMember pmMember = new ProjectMember();
        pmMember.setRole(ProjectRole.PM);

        when(memberRepository.findByProjectIdAndUserId(1L, 10L)).thenReturn(Optional.of(pmMember));

        boolean canManage = projectSecurity.canManageCustomFields(1L);
        assertTrue(canManage);
    }

    @Test
    public void testCanManageCustomFields_WhenNotMember_ReturnsFalse() {
        mockAuthUser(99L, "stranger@epms.com");

        when(memberRepository.findByProjectIdAndUserId(1L, 99L)).thenReturn(Optional.empty());
        when(memberRepository.existsByProjectIdAndUserId(1L, 99L)).thenReturn(false);

        boolean canManage = projectSecurity.canManageCustomFields(1L);
        assertFalse(canManage);
    }

    @Test
    public void testCanManageCustomFields_WhenMemberWithPermission_ReturnsTrue() {
        mockAuthUser(20L, "dev@epms.com");

        ProjectMember devMember = new ProjectMember();
        devMember.setRole(ProjectRole.DEVELOPER);

        activeProject.setAllowMemberManageCustomFields(true);

        when(memberRepository.findByProjectIdAndUserId(1L, 20L)).thenReturn(Optional.of(devMember));
        when(memberRepository.existsByProjectIdAndUserId(1L, 20L)).thenReturn(true);
        when(projectRepository.findById(1L)).thenReturn(Optional.of(activeProject));

        boolean canManage = projectSecurity.canManageCustomFields(1L);
        assertTrue(canManage);
    }

    @Test
    public void testCanManageCustomFields_WhenMemberWithoutPermission_ReturnsFalse() {
        mockAuthUser(20L, "dev@epms.com");

        ProjectMember devMember = new ProjectMember();
        devMember.setRole(ProjectRole.DEVELOPER);

        activeProject.setAllowMemberManageCustomFields(false);

        when(memberRepository.findByProjectIdAndUserId(1L, 20L)).thenReturn(Optional.of(devMember));
        when(memberRepository.existsByProjectIdAndUserId(1L, 20L)).thenReturn(true);
        when(projectRepository.findById(1L)).thenReturn(Optional.of(activeProject));

        boolean canManage = projectSecurity.canManageCustomFields(1L);
        assertFalse(canManage);
    }
}
