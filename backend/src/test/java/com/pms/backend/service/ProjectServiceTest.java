package com.pms.backend.service;

import com.pms.backend.dao.ProjectMemberRepository;
import com.pms.backend.dao.ProjectRepository;
import com.pms.backend.dao.UserRepository;
import com.pms.backend.dto.CreateProjectRequest;
import com.pms.backend.dto.ProjectResponse;
import com.pms.backend.enu.ProjectStatus;
import com.pms.backend.exception.BusinessException;
import com.pms.backend.exception.ForbiddenException;
import com.pms.backend.hibernateDao.ProjectListHibernateDao;
import com.pms.backend.model.Project;
import com.pms.backend.model.User;
import com.pms.backend.security.ProjectSecurity;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class ProjectServiceTest {

    @Mock
    private ProjectRepository projectRepository;

    @Mock
    private ProjectMemberRepository projectMemberRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private ProjectListHibernateDao projectListHibernateDao;

    @Mock
    private DefaultWorkflowSeeder defaultWorkflowSeeder;

    @Mock
    private InvitationService invitationService;

    @Mock
    private AuditService auditService;

    @Mock
    private ProjectSecurity projectSecurity;

    @InjectMocks
    private ProjectService projectService;

    private User pmUser;
    private User memberUser;

    @BeforeEach
    public void setup() {
        pmUser = new User();
        pmUser.setId(1L);
        pmUser.setEmail("pm@epms.com");

        memberUser = new User();
        memberUser.setId(2L);
        memberUser.setEmail("member@epms.com");
    }

    @Test
    public void testCreateProject_Success() {
        CreateProjectRequest request = new CreateProjectRequest();
        request.setName("New Project");
        request.setProjectKey("NPJ");
        request.setDescription("Test description");

        when(projectRepository.existsByProjectKeyIgnoreCase("NPJ")).thenReturn(false);
        when(projectRepository.save(any(Project.class))).thenAnswer(invocation -> {
            Project p = invocation.getArgument(0);
            p.setId(10L);
            return p;
        });

        ProjectResponse response = projectService.createProject(request, pmUser);

        assertNotNull(response);
        assertEquals("NPJ", response.getProjectKey());
        assertEquals("New Project", response.getName());
        verify(defaultWorkflowSeeder, times(1)).seedDefaultWorkflow(any(Project.class));
        verify(projectMemberRepository, times(1)).save(any());
        verify(auditService, times(1)).log(eq("CREATE_PROJECT"), eq("PROJECT"), anyLong(), anyLong(), any(), any());
    }

    @Test
    public void testCreateProject_DuplicateKey_ThrowsConflict() {
        CreateProjectRequest request = new CreateProjectRequest();
        request.setName("Duplicate Project");
        request.setProjectKey("DUP");

        when(projectRepository.existsByProjectKeyIgnoreCase("DUP")).thenReturn(true);

        assertThrows(BusinessException.class, () -> {
            projectService.createProject(request, pmUser);
        });

        verify(projectRepository, never()).save(any());
    }

    @Test
    public void testCreateProject_AnyUserCanCreate_Success() {
        CreateProjectRequest request = new CreateProjectRequest();
        request.setName("Member Project");
        request.setProjectKey("MPR");

        when(projectRepository.existsByProjectKeyIgnoreCase("MPR")).thenReturn(false);
        when(projectRepository.save(any(Project.class))).thenAnswer(invocation -> {
            Project p = invocation.getArgument(0);
            p.setId(20L);
            return p;
        });

        ProjectResponse response = projectService.createProject(request, memberUser);
        assertNotNull(response);
        assertEquals("PM", response.getMyRole());
        verify(projectRepository, times(1)).save(any());
    }

    @Test
    public void testCreateProject_WithInitialEmails_HandlesUserNotFoundAndSelfWithoutError() {
        CreateProjectRequest request = new CreateProjectRequest();
        request.setName("Project With Invites");
        request.setProjectKey("PWI");
        request.setInitialEmails(List.of("pm@epms.com", "notfound@epms.com"));

        when(projectRepository.existsByProjectKeyIgnoreCase("PWI")).thenReturn(false);
        when(projectRepository.save(any(Project.class))).thenAnswer(invocation -> {
            Project p = invocation.getArgument(0);
            p.setId(30L);
            return p;
        });
        when(userRepository.findByEmailIgnoreCase("notfound@epms.com")).thenReturn(java.util.Optional.empty());

        ProjectResponse response = projectService.createProject(request, pmUser);

        assertNotNull(response);
        assertNotNull(response.getInviteResults());
        assertEquals("MEMBER_ALREADY_EXISTS", response.getInviteResults().get("pm@epms.com"));
        assertEquals("USER_NOT_FOUND", response.getInviteResults().get("notfound@epms.com"));
        // Notice: invitationService.createInvitation should NOT be called for these invalid cases!
        verify(invitationService, never()).createInvitation(anyLong(), any(), any());
    }

    @Test
    public void testSuggestProjectKey_Unique() {
        when(projectRepository.existsByProjectKeyIgnoreCase("TEST")).thenReturn(false);
        String suggested = projectService.suggestProjectKey("Test");
        assertEquals("TEST", suggested);
    }

    @Test
    public void testSuggestProjectKey_Duplicate_AppendsNumber() {
        when(projectRepository.existsByProjectKeyIgnoreCase("TEST")).thenReturn(true);
        when(projectRepository.existsByProjectKeyIgnoreCase("TEST1")).thenReturn(false);

        String suggested = projectService.suggestProjectKey("Test");
        assertEquals("TEST1", suggested);
    }

    @Test
    public void testSuggestProjectKey_VietnameseName_Acronym() {
        when(projectRepository.existsByProjectKeyIgnoreCase("QLDA")).thenReturn(false);
        String suggested = projectService.suggestProjectKey("Quản lý dự án");
        assertEquals("QLDA", suggested);
    }
}
