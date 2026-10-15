package com.pms.backend.service;

import com.pms.backend.dao.ProjectMemberRepository;
import com.pms.backend.dao.ProjectRepository;
import com.pms.backend.enu.ProjectRole;
import com.pms.backend.exception.BusinessException;
import com.pms.backend.model.Project;
import com.pms.backend.model.ProjectMember;
import com.pms.backend.model.User;
import com.pms.backend.security.ProjectSecurity;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class MembershipServiceTest {

    @Mock
    private ProjectMemberRepository memberRepository;

    @Mock
    private ProjectRepository projectRepository;

    @Mock
    private AuditService auditService;

    @Mock
    private ProjectSecurity projectSecurity;

    @InjectMocks
    private MembershipService membershipService;

    private Project project;
    private User pmUser;
    private ProjectMember pmMember;

    @BeforeEach
    public void setup() {
        project = new Project();
        project.setId(1L);
        project.setProjectKey("PRJ");

        pmUser = new User();
        pmUser.setId(10L);

        pmMember = new ProjectMember();
        pmMember.setId(100L);
        pmMember.setProject(project);
        pmMember.setUser(pmUser);
        pmMember.setRole(ProjectRole.PM);
    }

    @Test
    public void testRemoveMember_LastPM_ThrowsException() {
        when(memberRepository.findByProjectIdAndUserId(1L, 10L)).thenReturn(Optional.of(pmMember));
        when(memberRepository.countByProjectIdAndRole(1L, ProjectRole.PM)).thenReturn(1L);

        assertThrows(BusinessException.class, () -> {
            membershipService.removeMember(1L, 10L);
        });

        verify(memberRepository, never()).delete(any());
    }

    @Test
    public void testRemoveMember_NotLastPM_Success() {
        when(memberRepository.findByProjectIdAndUserId(1L, 10L)).thenReturn(Optional.of(pmMember));
        when(memberRepository.countByProjectIdAndRole(1L, ProjectRole.PM)).thenReturn(2L);

        membershipService.removeMember(1L, 10L);

        verify(memberRepository, times(1)).delete(pmMember);
        verify(auditService, times(1)).log(eq("REMOVE_MEMBER"), eq("PROJECT_MEMBER"), anyLong(), anyLong(), any(), any());
    }

    @Test
    public void testChangeMemberRole_LastPM_ThrowsException() {
        when(memberRepository.findByProjectIdAndUserId(1L, 10L)).thenReturn(Optional.of(pmMember));
        when(memberRepository.countByProjectIdAndRole(1L, ProjectRole.PM)).thenReturn(1L);

        assertThrows(BusinessException.class, () -> {
            membershipService.changeMemberRole(1L, 10L, ProjectRole.DEVELOPER);
        });

        verify(memberRepository, never()).save(any());
    }
}
