package com.pms.backend.service.impl;

import com.pms.backend.service.interfaces.*;

import com.pms.backend.config.AppProperties;
import com.pms.backend.dao.InvitationRepository;
import com.pms.backend.dao.ProjectMemberRepository;
import com.pms.backend.dao.ProjectRepository;
import com.pms.backend.dao.UserRepository;
import com.pms.backend.dto.InviteMemberRequest;
import com.pms.backend.enu.ErrorCode;
import com.pms.backend.enu.InvitationStatus;
import com.pms.backend.enu.NotificationType;
import com.pms.backend.enu.ProjectRole;
import com.pms.backend.exception.BusinessException;
import com.pms.backend.exception.ResourceNotFoundException;
import com.pms.backend.exception.ValidationException;
import com.pms.backend.model.Invitation;
import com.pms.backend.model.Project;
import com.pms.backend.model.ProjectMember;
import com.pms.backend.model.User;
import com.pms.backend.security.ProjectSecurity;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

@Service
public class InvitationServiceImpl implements IInvitationService {

    private final InvitationRepository invitationRepository;
    private final ProjectRepository projectRepository;
    private final UserRepository userRepository;
    private final ProjectMemberRepository memberRepository;
    private final INotificationService notificationService;
    private final IMailService mailService;
    private final IAuditService auditService;
    private final ProjectSecurity projectSecurity;
    private final AppProperties appProperties;

    public InvitationServiceImpl(InvitationRepository invitationRepository,
                             ProjectRepository projectRepository,
                             UserRepository userRepository,
                             ProjectMemberRepository memberRepository,
                             INotificationService notificationService,
                             IMailService mailService,
                             IAuditService auditService,
                             ProjectSecurity projectSecurity,
                             AppProperties appProperties) {
        this.invitationRepository = invitationRepository;
        this.projectRepository = projectRepository;
        this.userRepository = userRepository;
        this.memberRepository = memberRepository;
        this.notificationService = notificationService;
        this.mailService = mailService;
        this.auditService = auditService;
        this.projectSecurity = projectSecurity;
        this.appProperties = appProperties;
    }

    @Transactional(noRollbackFor = {BusinessException.class, ResourceNotFoundException.class, ValidationException.class})
    public Invitation createInvitation(Long projectId, InviteMemberRequest request, User inviter) {
        projectSecurity.assertProjectWritable(projectId);

        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy dự án: " + projectId));

        String email = request.getEmail().trim().toLowerCase();

        // 1. Check if user exists in the system
        User recipient = userRepository.findByEmailIgnoreCase(email)
                .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND, "Người dùng với email '" + email + "' chưa có tài khoản trong hệ thống"));

        // 2. Check if already a project member
        if (memberRepository.existsByProjectIdAndUserId(projectId, recipient.getId())) {
            throw new BusinessException(ErrorCode.MEMBER_ALREADY_EXISTS, "Người dùng này đã là thành viên của dự án");
        }

        // 3. Check for existing PENDING invitation
        Optional<Invitation> pendingOpt = invitationRepository.findByProjectIdAndEmailIgnoreCaseAndStatus(projectId, email, InvitationStatus.PENDING);
        if (pendingOpt.isPresent()) {
            Invitation existing = pendingOpt.get();
            if (existing.getExpiresAt().isAfter(LocalDateTime.now())) {
                throw new BusinessException(ErrorCode.CONFLICT, "Đã có lời mời đang chờ xử lý gửi tới email này");
            } else {
                existing.setStatus(InvitationStatus.EXPIRED);
                invitationRepository.save(existing);
            }
        }

        // 4. Create new invitation
        int expiryDays = appProperties.getInvitation().getExpiryDays();
        Invitation invitation = new Invitation();
        invitation.setProject(project);
        invitation.setEmail(email);
        invitation.setRole(request.getRole() != null ? request.getRole() : ProjectRole.MEMBER);
        invitation.setToken(UUID.randomUUID().toString());
        invitation.setStatus(InvitationStatus.PENDING);
        invitation.setExpiresAt(LocalDateTime.now().plusDays(expiryDays));
        invitation.setInvitedBy(inviter);

        invitation = invitationRepository.save(invitation);

        // 5. Send notification + email
        notificationService.notify(
                NotificationType.INVITE_RECEIVED,
                List.of(recipient),
                "Lời mời tham gia dự án: " + project.getName(),
                "Bạn được mời tham gia dự án " + project.getName() + " với vai trò " + invitation.getRole().name(),
                "/invitations",
                String.valueOf(invitation.getId()),
                inviter
        );

        String acceptUrl = "http://localhost:3000/invitations";
        mailService.sendMailAsync(
                email,
                "[EPMS] Lời mời tham gia dự án " + project.getName(),
                "invitation",
                Map.of(
                        "recipientEmail", email,
                        "projectName", project.getName(),
                        "role", invitation.getRole().name(),
                        "inviterName", inviter != null ? inviter.getFullName() : "Quản trị viên",
                        "acceptUrl", acceptUrl,
                        "expiryDays", expiryDays
                )
        );

        auditService.log("INVITE_MEMBER", "PROJECT", projectId, projectId, null, "Invited " + email + " as " + invitation.getRole());

        return invitation;
    }

    public List<Invitation> getProjectInvitations(Long projectId) {
        return invitationRepository.findByProjectId(projectId);
    }

    public List<Invitation> getMyInvitations(String userEmail) {
        return invitationRepository.findByEmailIgnoreCaseAndStatus(userEmail, InvitationStatus.PENDING);
    }

    @Transactional
    public void acceptInvitation(Long invitationId, User user) {
        Invitation invitation = invitationRepository.findById(invitationId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy lời mời với ID: " + invitationId));

        if (!invitation.getEmail().equalsIgnoreCase(user.getEmail())) {
            throw new BusinessException(ErrorCode.FORBIDDEN, "Bạn không có quyền thao tác trên lời mời này");
        }

        if (invitation.getStatus() != InvitationStatus.PENDING) {
            throw new BusinessException("Lời mời này không còn ở trạng thái chờ xử lý (" + invitation.getStatus() + ")");
        }

        if (invitation.getExpiresAt().isBefore(LocalDateTime.now())) {
            invitation.setStatus(InvitationStatus.EXPIRED);
            invitationRepository.save(invitation);
            throw new BusinessException("Lời mời này đã hết hạn");
        }

        Project project = invitation.getProject();
        projectSecurity.assertProjectWritable(project.getId());

        // Add member if not already
        if (!memberRepository.existsByProjectIdAndUserId(project.getId(), user.getId())) {
            ProjectMember member = new ProjectMember();
            member.setProject(project);
            member.setUser(user);
            member.setRole(invitation.getRole());
            memberRepository.save(member);
        }

        invitation.setStatus(InvitationStatus.ACCEPTED);
        invitationRepository.save(invitation);

        // Notify inviter
        if (invitation.getInvitedBy() != null) {
            notificationService.notify(
                    NotificationType.INVITE_RESPONDED,
                    List.of(invitation.getInvitedBy()),
                    user.getFullName() + " đã chấp nhận lời mời",
                    user.getFullName() + " đã đồng ý tham gia dự án " + project.getName(),
                    "/projects/" + project.getId() + "/settings/members",
                    String.valueOf(project.getId()),
                    user
            );
        }

        auditService.log("ACCEPT_INVITATION", "PROJECT_MEMBER", user.getId(), project.getId(), null, "User " + user.getEmail() + " joined as " + invitation.getRole());
    }

    @Transactional
    public void declineInvitation(Long invitationId, User user) {
        Invitation invitation = invitationRepository.findById(invitationId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy lời mời: " + invitationId));

        if (!invitation.getEmail().equalsIgnoreCase(user.getEmail())) {
            throw new BusinessException(ErrorCode.FORBIDDEN, "Bạn không có quyền thao tác trên lời mời này");
        }

        invitation.setStatus(InvitationStatus.DECLINED);
        invitationRepository.save(invitation);

        if (invitation.getInvitedBy() != null) {
            notificationService.notify(
                    NotificationType.INVITE_RESPONDED,
                    List.of(invitation.getInvitedBy()),
                    user.getFullName() + " đã từ chối lời mời",
                    user.getFullName() + " đã từ chối tham gia dự án " + invitation.getProject().getName(),
                    "/projects/" + invitation.getProject().getId() + "/settings/members",
                    String.valueOf(invitation.getProject().getId()),
                    user
            );
        }

        auditService.log("DECLINE_INVITATION", "PROJECT", invitation.getProject().getId(), invitation.getProject().getId(), null, "User " + user.getEmail() + " declined invitation");
    }
}
