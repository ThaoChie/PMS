package com.pms.backend.service.impl;

import com.pms.backend.exception.BusinessException;
import com.pms.backend.exception.ResourceNotFoundException;
import com.pms.backend.dao.IssueRepository;
import com.pms.backend.dao.ProjectMemberRepository;
import com.pms.backend.dao.ProjectRepository;
import com.pms.backend.dao.UserRepository;
import com.pms.backend.dto.CreateProjectRequest;
import com.pms.backend.dto.InviteMemberRequest;
import com.pms.backend.dto.MemberResponse;
import com.pms.backend.dto.ProjectResponse;
import com.pms.backend.dto.UpdateProjectRequest;
import com.pms.backend.enu.ErrorCode;
import com.pms.backend.enu.ProjectRole;
import com.pms.backend.enu.ProjectStatus;
import com.pms.backend.hibernateDao.ProjectListHibernateDao;
import com.pms.backend.model.Project;
import com.pms.backend.model.ProjectMember;
import com.pms.backend.model.User;
import com.pms.backend.security.AuthUserPrincipal;
import com.pms.backend.security.ProjectSecurity;
import com.pms.backend.service.interfaces.IAuditService;
import com.pms.backend.service.interfaces.IDefaultWorkflowSeeder;
import com.pms.backend.service.interfaces.IInvitationService;
import com.pms.backend.service.interfaces.IProjectService;
import com.pms.backend.wrapper.PageWrapper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.text.Normalizer;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

@Service
public class ProjectServiceImpl implements IProjectService {

    private final ProjectRepository projectRepository;
    private final ProjectMemberRepository projectMemberRepository;
    private final UserRepository userRepository;
    private final IssueRepository issueRepository;
    private final ProjectListHibernateDao projectListHibernateDao;
    private final IDefaultWorkflowSeeder defaultWorkflowSeeder;
    private final IInvitationService invitationService;
    private final IAuditService auditService;
    private final ProjectSecurity projectSecurity;

    public ProjectServiceImpl(ProjectRepository projectRepository,
                              ProjectMemberRepository projectMemberRepository,
                              UserRepository userRepository,
                              IssueRepository issueRepository,
                              ProjectListHibernateDao projectListHibernateDao,
                              IDefaultWorkflowSeeder defaultWorkflowSeeder,
                              IInvitationService invitationService,
                              IAuditService auditService,
                              ProjectSecurity projectSecurity) {
        this.projectRepository = projectRepository;
        this.projectMemberRepository = projectMemberRepository;
        this.userRepository = userRepository;
        this.issueRepository = issueRepository;
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
            String suggested = suggestProjectKey(key);
            throw new BusinessException(ErrorCode.CONFLICT, "Mã dự án '" + key + "' đã tồn tại. Gợi ý: " + suggested);
        }

        Project project = new Project();
        project.setName(request.getName().trim());
        project.setProjectKey(key);
        project.setDescription(request.getDescription());
        project.setStatus(ProjectStatus.INITIATED);
        project.setCreatedBy(creator);
        project.setIssueSeq(0);
        if (request.getColor() != null && !request.getColor().isBlank()) {
            project.setColor(request.getColor().trim());
        }
        if (request.getIcon() != null && !request.getIcon().isBlank()) {
            project.setIcon(request.getIcon().trim());
        }

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
        response.setMemberCount(1);
        response.setMembers(List.of(MemberResponse.from(creatorMember)));
        response.setOpenIssuesCount(0);
        response.setInviteResults(inviteResults);
        return response;
    }

    public PageWrapper<ProjectResponse> getProjects(Long userId, String q, String sort, int page, int size) {
        PageWrapper<ProjectResponse> pageWrapper = projectListHibernateDao.findProjects(userId, q, sort, page, size);
        if (!pageWrapper.getContent().isEmpty()) {
            List<Long> projectIds = pageWrapper.getContent().stream()
                    .map(ProjectResponse::getId)
                    .collect(Collectors.toList());

            // 1. Roles for current user
            if (userId != null) {
                List<ProjectMember> memberships = projectMemberRepository.findByUserId(userId);
                Map<Long, String> roleByProjectId = memberships.stream()
                        .filter(pm -> pm.getProject() != null && pm.getProject().getId() != null)
                        .collect(Collectors.toMap(pm -> pm.getProject().getId(), pm -> pm.getRole().name(), (r1, r2) -> r1));
                for (ProjectResponse pr : pageWrapper.getContent()) {
                    String role = roleByProjectId.get(pr.getId());
                    if (role != null) {
                        pr.setMyRole(role);
                    }
                }
            }

            // 2. Member counts & Members
            try {
                List<Object[]> memberCounts = projectMemberRepository.countMembersByProjectIds(projectIds);
                Map<Long, Integer> memberCountMap = memberCounts.stream()
                        .collect(Collectors.toMap(arr -> (Long) arr[0], arr -> ((Number) arr[1]).intValue()));

                List<ProjectMember> allMembers = projectMemberRepository.findMembersByProjectIds(projectIds);
                Map<Long, List<MemberResponse>> membersMap = allMembers.stream()
                        .collect(Collectors.groupingBy(
                                pm -> pm.getProject().getId(),
                                Collectors.mapping(MemberResponse::from, Collectors.toList())
                        ));

                for (ProjectResponse pr : pageWrapper.getContent()) {
                    pr.setMemberCount(memberCountMap.getOrDefault(pr.getId(), 0));
                    pr.setMembers(membersMap.getOrDefault(pr.getId(), new ArrayList<>()));
                }
            } catch (Exception ignored) {}

            // 3. Open issues count
            try {
                List<Object[]> openIssueCounts = issueRepository.countOpenIssuesByProjectIds(projectIds);
                Map<Long, Integer> openIssuesMap = openIssueCounts.stream()
                        .collect(Collectors.toMap(arr -> (Long) arr[0], arr -> ((Number) arr[1]).intValue()));
                for (ProjectResponse pr : pageWrapper.getContent()) {
                    pr.setOpenIssuesCount(openIssuesMap.getOrDefault(pr.getId(), 0));
                }
            } catch (Exception ignored) {}
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
        try {
            res.setMemberCount((int) projectMemberRepository.countByProjectId(projectId));
            res.setMembers(projectMemberRepository.findByProjectId(projectId).stream()
                    .map(MemberResponse::from)
                    .collect(Collectors.toList()));
            res.setOpenIssuesCount((int) issueRepository.countByProjectIdAndDeletedAtIsNull(projectId));
        } catch (Exception ignored) {}
        return res;
    }

    @Transactional
    public ProjectResponse updateProject(Long projectId, UpdateProjectRequest request) {
        projectSecurity.assertProjectWritable(projectId);

        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy dự án với ID: " + projectId));

        String before = "Name: " + project.getName() + ", Desc: " + project.getDescription() + ", Color: " + project.getColor() + ", Icon: " + project.getIcon();

        if (request.getName() != null && !request.getName().isBlank()) {
            project.setName(request.getName().trim());
        }
        if (request.getDescription() != null) {
            project.setDescription(request.getDescription().trim());
        }
        if (request.getColor() != null && !request.getColor().isBlank()) {
            project.setColor(request.getColor().trim());
        }
        if (request.getIcon() != null && !request.getIcon().isBlank()) {
            project.setIcon(request.getIcon().trim());
        }

        project = projectRepository.save(project);
        String after = "Name: " + project.getName() + ", Desc: " + project.getDescription() + ", Color: " + project.getColor() + ", Icon: " + project.getIcon();

        auditService.log("UPDATE_PROJECT", "PROJECT", project.getId(), project.getId(), before, after);

        ProjectResponse res = ProjectResponse.from(project);
        try {
            res.setMemberCount((int) projectMemberRepository.countByProjectId(projectId));
            res.setMembers(projectMemberRepository.findByProjectId(projectId).stream()
                    .map(MemberResponse::from)
                    .collect(Collectors.toList()));
            res.setOpenIssuesCount((int) issueRepository.countByProjectIdAndDeletedAtIsNull(projectId));
        } catch (Exception ignored) {}
        return res;
    }

    @Transactional
    public ProjectResponse updateProjectPermissions(Long projectId, com.pms.backend.dto.ProjectPermissionsRequest request) {
        projectSecurity.assertProjectWritable(projectId);

        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy dự án với ID: " + projectId));

        if (request.getAllowMemberDeleteIssue() != null) {
            project.setAllowMemberDeleteIssue(request.getAllowMemberDeleteIssue());
        }
        if (request.getAllowMemberDeleteSubtask() != null) {
            project.setAllowMemberDeleteSubtask(request.getAllowMemberDeleteSubtask());
        }
        if (request.getAllowMemberConvertSubtask() != null) {
            project.setAllowMemberConvertSubtask(request.getAllowMemberConvertSubtask());
        }
        if (request.getAllowMemberManageCustomFields() != null) {
            project.setAllowMemberManageCustomFields(request.getAllowMemberManageCustomFields());
        }

        project = projectRepository.save(project);
        auditService.log("UPDATE_PROJECT_PERMISSIONS", "PROJECT", project.getId(), project.getId(),
                "Updated project permissions", "Permissions updated");

        ProjectResponse res = ProjectResponse.from(project);
        AuthUserPrincipal principal = projectSecurity.getCurrentUser();
        if (principal != null) {
            projectMemberRepository.findByProjectIdAndUserId(projectId, principal.getId())
                    .ifPresent(pm -> res.setMyRole(pm.getRole().name()));
        }
        try {
            res.setMemberCount((int) projectMemberRepository.countByProjectId(projectId));
            res.setMembers(projectMemberRepository.findByProjectId(projectId).stream()
                    .map(MemberResponse::from)
                    .collect(Collectors.toList()));
            res.setOpenIssuesCount((int) issueRepository.countByProjectIdAndDeletedAtIsNull(projectId));
        } catch (Exception ignored) {}
        return res;
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

        ProjectResponse res = ProjectResponse.from(project);
        try {
            res.setMemberCount((int) projectMemberRepository.countByProjectId(projectId));
            res.setMembers(projectMemberRepository.findByProjectId(projectId).stream()
                    .map(MemberResponse::from)
                    .collect(Collectors.toList()));
            res.setOpenIssuesCount((int) issueRepository.countByProjectIdAndDeletedAtIsNull(projectId));
        } catch (Exception ignored) {}
        return res;
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
        req.setColor(project.getColor());
        req.setIcon(project.getIcon());
        createProject(req, creator);
        return projectRepository.findByProjectKeyIgnoreCase(project.getProjectKey()).orElse(project);
    }

    public String suggestProjectKey(String name) {
        if (name == null || name.trim().isEmpty()) {
            return "PRJ";
        }

        String base = generateBaseKey(name);
        if (!projectRepository.existsByProjectKeyIgnoreCase(base)) {
            return base;
        }

        for (int i = 1; i <= 999; i++) {
            String suffix = String.valueOf(i);
            int maxBaseLen = Math.max(2, 6 - suffix.length());
            String candidateBase = base.length() > maxBaseLen ? base.substring(0, maxBaseLen) : base;
            String candidate = candidateBase + suffix;
            if (!projectRepository.existsByProjectKeyIgnoreCase(candidate)) {
                return candidate;
            }
        }

        return base.substring(0, Math.min(base.length(), 4)) + (System.currentTimeMillis() % 100);
    }

    public boolean isProjectKeyAvailable(String key) {
        if (key == null || key.trim().isEmpty()) {
            return false;
        }
        return !projectRepository.existsByProjectKeyIgnoreCase(key.trim());
    }

    private String generateBaseKey(String name) {
        String clean = Normalizer.normalize(name, Normalizer.Form.NFD)
                .replaceAll("\\p{InCombiningDiacriticalMarks}+", "")
                .replace("đ", "d")
                .replace("Đ", "D")
                .trim();

        String[] words = clean.split("\\s+");
        if (words.length >= 2) {
            StringBuilder acronym = new StringBuilder();
            for (String w : words) {
                if (!w.isEmpty() && Character.isLetterOrDigit(w.charAt(0))) {
                    acronym.append(Character.toUpperCase(w.charAt(0)));
                }
            }
            String acr = acronym.toString().replaceAll("[^A-Z0-9]", "");
            if (acr.length() >= 2 && acr.length() <= 6) {
                return acr;
            }
        }

        String raw = clean.replaceAll("[^a-zA-Z0-9]", "").toUpperCase();
        if (raw.length() >= 2) {
            return raw.substring(0, Math.min(raw.length(), 6));
        } else if (raw.length() == 1) {
            return raw + "P";
        }
        return "PRJ";
    }
}
