package com.pms.backend.service;

import com.pms.backend.dao.ProjectMemberRepository;
import com.pms.backend.dao.ProjectRepository;
import com.pms.backend.dao.UserRepository;
import com.pms.backend.dto.CreateProjectRequest;
import com.pms.backend.dto.InviteMemberRequest;
import com.pms.backend.dto.ProjectResponse;
import com.pms.backend.dto.UpdateProjectRequest;
import com.pms.backend.enu.ErrorCode;
import com.pms.backend.enu.ProjectRole;
import com.pms.backend.enu.ProjectStatus;
import com.pms.backend.enu.RoleSystem;
import com.pms.backend.exception.BusinessException;
import com.pms.backend.exception.ForbiddenException;
import com.pms.backend.exception.ResourceNotFoundException;
import com.pms.backend.hibernateDao.ProjectListHibernateDao;
import com.pms.backend.model.Project;
import com.pms.backend.model.ProjectMember;
import com.pms.backend.model.User;
import com.pms.backend.security.AuthUserPrincipal;
import com.pms.backend.security.ProjectSecurity;
import com.pms.backend.wrapper.PageWrapper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;
import java.util.regex.Pattern;

@Service
public class ProjectService {

    private final ProjectRepository projectRepository;
    private final ProjectMemberRepository projectMemberRepository;
    private final UserRepository userRepository;
    private final ProjectListHibernateDao projectListHibernateDao;
    private final DefaultWorkflowSeeder defaultWorkflowSeeder;
    private final InvitationService invitationService;
    private final AuditService auditService;
    private final ProjectSecurity projectSecurity;

    public ProjectService(ProjectRepository projectRepository,
                          ProjectMemberRepository projectMemberRepository,
                          UserRepository userRepository,
                          ProjectListHibernateDao projectListHibernateDao,
                          DefaultWorkflowSeeder defaultWorkflowSeeder,
                          InvitationService invitationService,
                          AuditService auditService,
                          ProjectSecurity projectSecurity) {
        this.projectRepository = projectRepository;
        this.projectMemberRepository = projectMemberRepository;
        this.userRepository = userRepository;
        this.projectListHibernateDao = projectListHibernateDao;
        this.defaultWorkflowSeeder = defaultWorkflowSeeder;
        this.invitationService = invitationService;
        this.auditService = auditService;
        this.projectSecurity = projectSecurity;
    }

    @Transactional
    public ProjectResponse createProject(CreateProjectRequest request, User creator) {
        String key = request.getProjectKey() != null ? request.getProjectKey().toUpperCase().trim() : "";
        if (!Pattern.matches("^[A-Z0-9]{2,10}$", key)) {
            throw new BusinessException(ErrorCode.VALIDATION_ERROR, "Mã dự án (key) phải gồm từ 2 đến 10 ký tự chữ hoa hoặc chữ số");
        }

        if (projectRepository.existsByProjectKeyIgnoreCase(key)) {
            throw new BusinessException(ErrorCode.PROJECT_KEY_EXISTS, "Mã dự án '" + key + "' đã tồn tại trong hệ thống");
        }

        Project project = new Project();
        project.setName(request.getName().trim());
        project.setProjectKey(key);
        project.setDescription(request.getDescription());
        project.setStatus(ProjectStatus.INITIATED);
        project.setCreatedBy(creator);
        project.setIssueSeq(0);

        Project savedProject = projectRepository.save(project);

        // Creator becomes PM of project (BR-AUTH-05)
        ProjectMember creatorMember = new ProjectMember();
        creatorMember.setProject(savedProject);
        creatorMember.setUser(creator);
        creatorMember.setRole(ProjectRole.PM);
        projectMemberRepository.save(creatorMember);

        // Seed default workflow (4 statuses + transitions)
        defaultWorkflowSeeder.seedDefaultWorkflow(savedProject);

        // Initial invitations per A-12
        Map<String, String> inviteResults = new HashMap<>();
        if (request.getInitialEmails() != null) {
            for (String rawEmail : request.getInitialEmails()) {
                String email = rawEmail != null ? rawEmail.trim().toLowerCase() : "";
                if (email.isEmpty()) continue;

                // 1. Check if email is the creator themselves
                if (creator.getEmail() != null && email.equalsIgnoreCase(creator.getEmail().trim().toLowerCase())) {
                    inviteResults.put(email, "MEMBER_ALREADY_EXISTS");
                    continue;
                }

                // 2. Check if user exists in the system
                Optional<User> recipientOpt = userRepository.findByEmailIgnoreCase(email);
                if (recipientOpt.isEmpty()) {
                    inviteResults.put(email, "USER_NOT_FOUND");
                    continue;
                }

                User recipient = recipientOpt.get();

                // 3. Check if already a project member
                if (projectMemberRepository.existsByProjectIdAndUserId(savedProject.getId(), recipient.getId())) {
                    inviteResults.put(email, "MEMBER_ALREADY_EXISTS");
                    continue;
                }

                try {
                    InviteMemberRequest inviteReq = new InviteMemberRequest();
                    inviteReq.setEmail(email);
                    inviteReq.setRole(ProjectRole.MEMBER);
                    invitationService.createInvitation(savedProject.getId(), inviteReq, creator);
                    inviteResults.put(email, "SUCCESS");
                } catch (BusinessException be) {
                    inviteResults.put(email, be.getErrorCode() != null ? be.getErrorCode().name() : be.getMessage());
                } catch (Exception ex) {
                    inviteResults.put(email, ex.getMessage());
                }
            }
        }

        auditService.log("CREATE_PROJECT", "PROJECT", savedProject.getId(), savedProject.getId(), null, "Created project " + savedProject.getName());

        ProjectResponse response = ProjectResponse.from(savedProject);
        response.setMyRole("PM");
        response.setInviteResults(inviteResults);
        return response;
    }

    public PageWrapper<ProjectResponse> getProjects(Long userId, RoleSystem systemRole, String q, String sort, int page, int size) {
        PageWrapper<ProjectResponse> pageWrapper = projectListHibernateDao.findProjects(userId, systemRole, q, sort, page, size);
        for (ProjectResponse pr : pageWrapper.getContent()) {
            projectMemberRepository.findByProjectIdAndUserId(pr.getId(), userId)
                    .ifPresent(pm -> pr.setMyRole(pm.getRole().name()));
        }
        return pageWrapper;
    }

    public ProjectResponse getProjectById(Long projectId) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy dự án với ID: " + projectId));
        ProjectResponse res = ProjectResponse.from(project);
        AuthUserPrincipal principal = projectSecurity.getCurrentUser();
        if (principal != null) {
            projectMemberRepository.findByProjectIdAndUserId(projectId, principal.getId())
                    .ifPresent(pm -> res.setMyRole(pm.getRole().name()));
        }
        return res;
    }

    @Transactional
    public ProjectResponse updateProject(Long projectId, UpdateProjectRequest request) {
        projectSecurity.assertProjectWritable(projectId);

        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy dự án với ID: " + projectId));

        String before = "Name: " + project.getName() + ", Desc: " + project.getDescription();

        if (request.getName() != null && !request.getName().isBlank()) {
            project.setName(request.getName().trim());
        }
        if (request.getDescription() != null) {
            project.setDescription(request.getDescription().trim());
        }

        project = projectRepository.save(project);
        String after = "Name: " + project.getName() + ", Desc: " + project.getDescription();

        auditService.log("UPDATE_PROJECT", "PROJECT", project.getId(), project.getId(), before, after);

        return ProjectResponse.from(project);
    }

    @Transactional
    public ProjectResponse closeProject(Long projectId) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy dự án với ID: " + projectId));

        if (project.getStatus() == ProjectStatus.CLOSED) {
            throw new BusinessException(ErrorCode.CONFLICT, "Dự án đã ở trạng thái đóng trước đó");
        }

        project.setStatus(ProjectStatus.CLOSED);
        project = projectRepository.save(project);

        auditService.log("CLOSE_PROJECT", "PROJECT", project.getId(), project.getId(), "Status: ACTIVE", "Status: CLOSED");

        return ProjectResponse.from(project);
    }

    // Kept for backward compatibility
    @Transactional
    public Project createProject(Project project, String creatorEmail) {
        User creator = userRepository.findByEmail(creatorEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        CreateProjectRequest req = new CreateProjectRequest();
        req.setName(project.getName());
        req.setProjectKey(project.getProjectKey());
        req.setDescription(project.getDescription());
        createProject(req, creator);
        return projectRepository.findByProjectKeyIgnoreCase(project.getProjectKey()).orElse(project);
    }
}
