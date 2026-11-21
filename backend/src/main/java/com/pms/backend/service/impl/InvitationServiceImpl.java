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
import com.pms.backend.security.InvitationRateLimiter;
import com.pms.backend.security.ProjectSecurity;
import org.springframework.beans.factory.annotation.Autowired;
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
    private final InvitationRateLimiter invitationRateLimiter;

    public InvitationServiceImpl(InvitationRepository invitationRepository,
                             ProjectRepository projectRepository,
                             UserRepository userRepository,
                             ProjectMemberRepository memberRepository,
                             INotificationService notificationService,
                             IMailService mailService,
                             IAuditService auditService,
                             ProjectSecurity projectSecurity,
                             AppProperties appProperties) {
        this(invitationRepository, projectRepository, userRepository, memberRepository,
                notificationService, mailService, auditService, projectSecurity, appProperties, null);
    }

    @Autowired
    public InvitationServiceImpl(InvitationRepository invitationRepository,
                             ProjectRepository projectRepository,
                             UserRepository userRepository,
                             ProjectMemberRepository memberRepository,
                             INotificationService notificationService,
                             IMailService mailService,
                             IAuditService auditService,
                             ProjectSecurity projectSecurity,
                             AppProperties appProperties,
                             InvitationRateLimiter invitationRateLimiter) {
        this.invitationRepository = invitationRepository;
        this.projectRepository = projectRepository;
        this.userRepository = userRepository;
        this.memberRepository = memberRepository;
        this.notificationService = notificationService;
        this.mailService = mailService;
        this.auditService = auditService;
        this.projectSecurity = projectSecurity;
        this.appProperties = appProperties;
        this.invitationRateLimiter = invitationRateLimiter;
    }

    @Transactional(noRollbackFor = {BusinessException.class, ResourceNotFoundException.class, ValidationException.class})
    public Invitation createInvitation(Long projectId, InviteMemberRequest request, User inviter) {
        projectSecurity.assertProjectWritable(projectId);

        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy dự án: " + projectId));

        String email = normalizeAndValidateEmail(request, inviter);
        if (invitationRateLimiter != null && inviter != null) {
            invitationRateLimiter.checkUserRate(inviter.getId());
        }

        Optional<User> recipientOpt = userRepository.findByEmailIgnoreCase(email);
        assertNotAlreadyMember(projectId, recipientOpt);

        LocalDateTime now = LocalDateTime.now();
        ensureNoActivePendingInvitation(projectId, email, now);

        if (invitationRateLimiter != null) {
            invitationRateLimiter.checkProjectRate(projectId);
        }

        int expiryDays = appProperties.getInvitation().getExpiryDays();
        Invitation invitation = buildAndSavePendingInvitation(project, email, request.getRole(), inviter, now, expiryDays);
        dispatchInvitationNotifications(project, invitation, recipientOpt, inviter, expiryDays);

        auditService.log("INVITE_MEMBER", "PROJECT", projectId, projectId, null,
                "Invited " + email + " as " + invitation.getRole());
        return invitation;
    }

    private String normalizeAndValidateEmail(InviteMemberRequest request, User inviter) {
        if (request == null || request.getEmail() == null || request.getEmail().isBlank()) {
            throw new BusinessException(ErrorCode.VALIDATION_ERROR, "Email không được để trống");
        }
        String email = request.getEmail().trim().toLowerCase();
        if (inviter != null && inviter.getEmail() != null && email.equalsIgnoreCase(inviter.getEmail().trim())) {
            throw new BusinessException(ErrorCode.VALIDATION_ERROR, "Bạn không thể tự mời chính mình vào dự án");
        }
        return email;
    }

    private void assertNotAlreadyMember(Long projectId, Optional<User> recipientOpt) {
        if (recipientOpt.isPresent() && memberRepository.existsByProjectIdAndUserId(projectId, recipientOpt.get().getId())) {
            throw new BusinessException(ErrorCode.MEMBER_ALREADY_EXISTS, "Người dùng này đã là thành viên của dự án");
        }
    }

    private void ensureNoActivePendingInvitation(Long projectId, String email, LocalDateTime now) {
        Optional<Invitation> pendingOpt = invitationRepository.findByProjectIdAndEmailIgnoreCaseAndStatus(
                projectId, email, InvitationStatus.PENDING
        );
        if (pendingOpt.isEmpty()) {
            return;
        }
        Invitation existingPending = pendingOpt.get();
        if (existingPending.getExpiresAt() == null || !existingPending.getExpiresAt().isBefore(now)) {
            throw new BusinessException(
                    ErrorCode.INVITATION_ALREADY_PENDING,
                    "Đã có lời mời đang chờ phản hồi cho email này. Chỉ có thể mời lại sau khi lời mời bị từ chối, đã thu hồi hoặc hết hạn."
            );
        }
        existingPending.setStatus(InvitationStatus.EXPIRED);
        invitationRepository.saveAndFlush(existingPending);
    }

    private Invitation buildAndSavePendingInvitation(Project project, String email, ProjectRole requestedRole,
                                                     User inviter, LocalDateTime now, int expiryDays) {
        Invitation invitation = new Invitation();
        invitation.setProject(project);
        invitation.setEmail(email);
        invitation.setRole(requestedRole != null ? requestedRole : ProjectRole.MEMBER);
        invitation.setToken(UUID.randomUUID().toString());
        invitation.setStatus(InvitationStatus.PENDING);
        invitation.setExpiresAt(now.plusDays(expiryDays));
        invitation.setInvitedBy(inviter);
        return invitationRepository.save(invitation);
    }

    private void dispatchInvitationNotifications(Project project, Invitation invitation,
                                                 Optional<User> recipientOpt, User inviter, int expiryDays) {
        if (recipientOpt.isPresent()) {
            notificationService.notify(
                    NotificationType.INVITE_RECEIVED,
                    List.of(recipientOpt.get()),
                    "Lời mời tham gia dự án: " + project.getName(),
                    "Bạn được mời tham gia dự án " + project.getName() + " với vai trò " + invitation.getRole().name(),
                    "/notifications?tab=invite",
                    String.valueOf(invitation.getId()),
                    inviter
            );
        }

        String frontendBase = appProperties.getFrontendUrl() != null
                ? appProperties.getFrontendUrl().replaceAll("/+$", "")
                : "https://pms-chi-self.vercel.app";
        String acceptUrl = frontendBase + "/notifications?tab=invite&invitation=" + invitation.getId();
        mailService.sendMailAsync(
                invitation.getEmail(),
                "[EPMS] Lời mời tham gia dự án " + project.getName(),
                "invitation",
                Map.of(
                        "recipientEmail", invitation.getEmail(),
                        "projectName", project.getName(),
                        "role", invitation.getRole().name(),
                        "inviterName", inviter != null ? inviter.getFullName() : "Quản trị viên",
                        "acceptUrl", acceptUrl,
                        "expiryDays", expiryDays
                )
        );
    }

    @Transactional(readOnly = true)
    public List<Invitation> getProjectInvitations(Long projectId) {
        return invitationRepository.findByProjectId(projectId);
    }

    @Transactional(readOnly = true)
    public List<Invitation> getMyInvitations(String userEmail) {
        if (userEmail == null || userEmail.isBlank()) {
            return List.of();
        }
        LocalDateTime now = LocalDateTime.now();
        return invitationRepository.findByEmailIgnoreCaseAndStatus(userEmail.trim(), InvitationStatus.PENDING)
                .stream()
                .filter(inv -> inv.getExpiresAt() == null || !inv.getExpiresAt().isBefore(now))
                .toList();
    }

    @Transactional(readOnly = true)
    public List<Invitation> getAllMyInvitations(String userEmail) {
        if (userEmail == null || userEmail.isBlank()) {
            return List.of();
        }
        return invitationRepository.findByEmailIgnoreCaseOrderByIdDesc(userEmail.trim());
    }

    @Transactional(readOnly = true)
    public Invitation getInvitationForRecipient(Long invitationId, User user) {
        Invitation invitation = invitationRepository.findById(invitationId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy lời mời tham gia dự án"));

        if (user == null || user.getEmail() == null
                || !invitation.getEmail().equalsIgnoreCase(user.getEmail().trim())) {
            throw new BusinessException(
                    ErrorCode.FORBIDDEN,
                    "Lời mời này được gửi cho một địa chỉ email khác, không thuộc tài khoản đang đăng nhập."
            );
        }
        return invitation;
    }

    @Transactional
    public void acceptInvitation(Long invitationId, User user) {
        Invitation invitation = invitationRepository.findById(invitationId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy lời mời với ID: " + invitationId));

        if (!invitation.getEmail().equalsIgnoreCase(user.getEmail())) {
            throw new BusinessException(ErrorCode.FORBIDDEN, "Bạn không có quyền thao tác trên lời mời này");
        }

        if (invitation.getStatus() == InvitationStatus.CANCELLED) {
            throw new BusinessException(ErrorCode.CONFLICT, "Lời mời này đã được quản lý dự án thu hồi");
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

        if (!memberRepository.existsByProjectIdAndUserId(project.getId(), user.getId())) {
            ProjectMember member = new ProjectMember();
            member.setProject(project);
            member.setUser(user);
            member.setRole(invitation.getRole());
            memberRepository.save(member);
        }

        invitation.setStatus(InvitationStatus.ACCEPTED);
        invitationRepository.save(invitation);

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

        auditService.log("ACCEPT_INVITATION", "PROJECT_MEMBER", user.getId(), project.getId(), null,
                "User " + user.getEmail() + " joined as " + invitation.getRole());
    }

    @Transactional
    public void declineInvitation(Long invitationId, User user) {
        Invitation invitation = invitationRepository.findById(invitationId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy lời mời: " + invitationId));

        if (!invitation.getEmail().equalsIgnoreCase(user.getEmail())) {
            throw new BusinessException(ErrorCode.FORBIDDEN, "Bạn không có quyền thao tác trên lời mời này");
        }

        if (invitation.getStatus() != InvitationStatus.PENDING) {
            throw new BusinessException(ErrorCode.CONFLICT,
                    "Lời mời này không còn ở trạng thái chờ xử lý (" + invitation.getStatus() + ")");
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

        auditService.log("DECLINE_INVITATION", "PROJECT", invitation.getProject().getId(),
                invitation.getProject().getId(), null, "User " + user.getEmail() + " declined invitation");
    }

    @Transactional
    public void cancelInvitation(Long projectId, Long invitationId, User actor) {
        projectSecurity.assertProjectWritable(projectId);

        Invitation invitation = invitationRepository.findById(invitationId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy lời mời: " + invitationId));

        if (invitation.getProject() == null || !invitation.getProject().getId().equals(projectId)) {
            throw new ResourceNotFoundException("Không tìm thấy lời mời trong dự án này: " + invitationId);
        }

        if (invitation.getStatus() != InvitationStatus.PENDING) {
            throw new BusinessException(ErrorCode.CONFLICT,
                    "Chỉ có thể thu hồi lời mời đang ở trạng thái chờ phản hồi (" + invitation.getStatus() + ")");
        }

        invitation.setStatus(InvitationStatus.CANCELLED);
        invitationRepository.save(invitation);

        auditService.log("CANCEL_INVITATION", "PROJECT", projectId, projectId, null,
                "Cancelled pending invitation for " + invitation.getEmail());
    }
}
