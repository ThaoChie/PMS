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
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.Collections;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class RbacMatrixTest {

    @Mock
    private ProjectMemberRepository projectMemberRepository;

    @Mock
    private ProjectRepository projectRepository;

    @InjectMocks
    private ProjectSecurity projectSecurity;

    private AuthUserPrincipal pmUser;
    private AuthUserPrincipal devUser;

    @BeforeEach
    public void setup() {
        pmUser = new AuthUserPrincipal(2L, "pm@epms.com", "", true, Collections.emptyList());
        devUser = new AuthUserPrincipal(3L, "dev@epms.com", "", true, Collections.emptyList());
    }

    @AfterEach
    public void cleanup() {
        SecurityContextHolder.clearContext();
    }

    private void authenticate(AuthUserPrincipal principal) {
        UsernamePasswordAuthenticationToken auth = new UsernamePasswordAuthenticationToken(principal, null, principal.getAuthorities());
        SecurityContextHolder.getContext().setAuthentication(auth);
    }

    @Test
    public void testIsMember_RegularUser_ChecksMembership() {
        authenticate(devUser);
        when(projectMemberRepository.existsByProjectIdAndUserId(1L, 3L)).thenReturn(true);
        when(projectMemberRepository.existsByProjectIdAndUserId(2L, 3L)).thenReturn(false);

        assertTrue(projectSecurity.isMember(1L));
        assertFalse(projectSecurity.isMember(2L));
    }

    @Test
    public void testIsMember_Unauthenticated_ReturnsFalse() {
        assertFalse(projectSecurity.isMember(1L));
        verify(projectMemberRepository, never()).existsByProjectIdAndUserId(anyLong(), anyLong());
    }

    @Test
    public void testHasRole_Pm_MatchesRole() {
        authenticate(pmUser);
        ProjectMember pmMember = new ProjectMember();
        pmMember.setRole(ProjectRole.PM);

        when(projectMemberRepository.findByProjectIdAndUserId(1L, 2L)).thenReturn(Optional.of(pmMember));

        assertTrue(projectSecurity.hasRole(1L, "PM"));
        assertTrue(projectSecurity.isPmOrAdmin(1L));
        assertFalse(projectSecurity.hasRole(1L, "DEVELOPER"));
    }

    @Test
    public void testHasRole_Qa_MatchesRole() {
        AuthUserPrincipal qaUser = new AuthUserPrincipal(4L, "qa@epms.com", "", true, Collections.emptyList());
        authenticate(qaUser);
        ProjectMember qaMember = new ProjectMember();
        qaMember.setRole(ProjectRole.QA);

        when(projectMemberRepository.findByProjectIdAndUserId(1L, 4L)).thenReturn(Optional.of(qaMember));

        assertTrue(projectSecurity.hasRole(1L, "QA"));
        assertTrue(projectSecurity.hasRole(1L, "PM", "QA"));
        assertFalse(projectSecurity.hasRole(1L, "PM"));
        assertFalse(projectSecurity.isPmOrAdmin(1L));
        assertFalse(projectSecurity.hasRole(1L, "DEVELOPER"));
    }

    @Test
    public void testHasRole_Developer_CannotAccessBugReportRoles() {
        authenticate(devUser);
        ProjectMember devMember = new ProjectMember();
        devMember.setRole(ProjectRole.DEVELOPER);

        when(projectMemberRepository.findByProjectIdAndUserId(1L, 3L)).thenReturn(Optional.of(devMember));

        assertFalse(projectSecurity.hasRole(1L, "PM", "QA"));
        assertTrue(projectSecurity.hasRole(1L, "DEVELOPER"));
    }

    @Test
    public void testAssertProjectWritable_ClosedProject_ThrowsConflict() {
        Project closedProject = new Project();
        closedProject.setId(10L);
        closedProject.setStatus(ProjectStatus.CLOSED);

        when(projectRepository.findById(10L)).thenReturn(Optional.of(closedProject));

        assertThrows(BusinessException.class, () -> {
            projectSecurity.assertProjectWritable(10L);
        });
    }

    @Test
    public void testAssertProjectWritable_ActiveProject_Succeeds() {
        Project activeProject = new Project();
        activeProject.setId(10L);
        activeProject.setStatus(ProjectStatus.ACTIVE);

        when(projectRepository.findById(10L)).thenReturn(Optional.of(activeProject));

        assertDoesNotThrow(() -> {
            projectSecurity.assertProjectWritable(10L);
        });
    }
}
