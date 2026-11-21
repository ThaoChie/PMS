package com.pms.backend.service;

import com.pms.backend.config.AppProperties;
import com.pms.backend.dao.InvitationRepository;
import com.pms.backend.dao.ProjectMemberRepository;
import com.pms.backend.dao.ProjectRepository;
import com.pms.backend.dao.UserRepository;
import com.pms.backend.dto.InvitationResponse;
import com.pms.backend.dto.InviteMemberRequest;
import com.pms.backend.enu.ErrorCode;
import com.pms.backend.enu.InvitationStatus;
import com.pms.backend.enu.ProjectRole;
import com.pms.backend.exception.BusinessException;
import com.pms.backend.exception.ResourceNotFoundException;
import com.pms.backend.model.Invitation;
import com.pms.backend.model.Project;
import com.pms.backend.model.User;
import com.pms.backend.security.InvitationRateLimiter;
import com.pms.backend.security.ProjectSecurity;
import com.pms.backend.service.impl.InvitationServiceImpl;
import com.pms.backend.service.interfaces.IAuditService;
import com.pms.backend.service.interfaces.IMailService;
import com.pms.backend.service.interfaces.INotificationService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class InvitationLifecycleAndSpamProtectionTest {

    @Mock
    private InvitationRepository invitationRepository;
    @Mock
    private ProjectRepository projectRepository;
    @Mock
    private UserRepository userRepository;
    @Mock
    private ProjectMemberRepository memberRepository;
    @Mock
    private INotificationService notificationService;
    @Mock
    private IMailService mailService;
    @Mock
    private IAuditService auditService;
    @Mock
    private ProjectSecurity projectSecurity;
    @Mock
    private AppProperties appProperties;
    @Mock
    private InvitationRateLimiter invitationRateLimiter;

    @InjectMocks
    private InvitationServiceImpl invitationService;

    private Project project;
    private User pm;

    @BeforeEach
    public void setup() {
        project = new Project();
        project.setId(120L);
        project.setName("demo1");

        pm = new User();
        pm.setId(1L);
        pm.setEmail("thithanhxuanlai@gmail.com");
        pm.setFullName("Thị Thanh Xuân Lại");

        AppProperties.Invitation invProps = new AppProperties.Invitation();
        invProps.setExpiryDays(7);
        lenient().when(appProperties.getInvitation()).thenReturn(invProps);
        lenient().when(appProperties.getFrontendUrl()).thenReturn("https://pms-chi-self.vercel.app");
    }

    @Test
    @DisplayName("Chặn mời lại email đang PENDING còn hạn, không gửi mail hay tạo thông báo")
    public void testBlockDuplicatePendingInvitation() {
        InviteMemberRequest req = new InviteMemberRequest();
        req.setEmail("laithithanhxuan.06wq@gmail.com");
        req.setRole(ProjectRole.MEMBER);

        Invitation pending = new Invitation();
        pending.setId(55L);
        pending.setProject(project);
        pending.setEmail("laithithanhxuan.06wq@gmail.com");
        pending.setStatus(InvitationStatus.PENDING);
        pending.setExpiresAt(LocalDateTime.now().plusDays(6));

        when(projectRepository.findById(120L)).thenReturn(Optional.of(project));
        when(userRepository.findByEmailIgnoreCase("laithithanhxuan.06wq@gmail.com")).thenReturn(Optional.empty());
        when(invitationRepository.findByProjectIdAndEmailIgnoreCaseAndStatus(
                120L, "laithithanhxuan.06wq@gmail.com", InvitationStatus.PENDING))
                .thenReturn(Optional.of(pending));

        BusinessException ex = assertThrows(BusinessException.class, () ->
                invitationService.createInvitation(120L, req, pm));

        assertEquals(ErrorCode.INVITATION_ALREADY_PENDING, ex.getErrorCode());
        verify(invitationRepository, never()).save(any());
        verify(mailService, never()).sendMailAsync(anyString(), anyString(), anyString(), anyMap());
        verify(notificationService, never()).notify(any(), any(), any(), any(), any(), any(), any());
    }

    @Test
    @DisplayName("Cho phép mời lại sau khi PM thu hồi lời mời (CANCELLED) hoặc người nhận từ chối (DECLINED)")
    public void testCancelThenReinvite_Success() {
        Invitation pending = new Invitation();
        pending.setId(55L);
        pending.setProject(project);
        pending.setEmail("laithithanhxuan.06wq@gmail.com");
        pending.setStatus(InvitationStatus.PENDING);
        pending.setExpiresAt(LocalDateTime.now().plusDays(6));

        when(invitationRepository.findById(55L)).thenReturn(Optional.of(pending));

        // 1. PM thu hồi lời mời -> chuyển sang CANCELLED
        invitationService.cancelInvitation(120L, 55L, pm);
        assertEquals(InvitationStatus.CANCELLED, pending.getStatus());

        // 2. Sau khi đã CANCELLED, truy vấn PENDING trả về empty -> mời lại thành công
        InviteMemberRequest req = new InviteMemberRequest();
        req.setEmail("laithithanhxuan.06wq@gmail.com");
        req.setRole(ProjectRole.DEVELOPER);

        when(projectRepository.findById(120L)).thenReturn(Optional.of(project));
        when(userRepository.findByEmailIgnoreCase("laithithanhxuan.06wq@gmail.com")).thenReturn(Optional.empty());
        when(invitationRepository.findByProjectIdAndEmailIgnoreCaseAndStatus(
                120L, "laithithanhxuan.06wq@gmail.com", InvitationStatus.PENDING))
                .thenReturn(Optional.empty());
        when(invitationRepository.save(any(Invitation.class))).thenAnswer(i -> {
            Invitation saved = i.getArgument(0);
            saved.setId(56L);
            return saved;
        });

        Invitation reinvited = invitationService.createInvitation(120L, req, pm);
        assertEquals(56L, reinvited.getId());
        assertEquals(InvitationStatus.PENDING, reinvited.getStatus());
        assertEquals(ProjectRole.DEVELOPER, reinvited.getRole());
        verify(mailService, times(1)).sendMailAsync(eq("laithithanhxuan.06wq@gmail.com"), anyString(), anyString(), anyMap());
    }

    @Test
    @DisplayName("Tự động chuyển lời mời PENDING đã quá hạn sang EXPIRED trước khi tạo lời mời mới")
    public void testLazyExpireStalePendingInvitationBeforeReinvite() {
        InviteMemberRequest req = new InviteMemberRequest();
        req.setEmail("laithithanhxuan.06wq@gmail.com");

        Invitation expiredPending = new Invitation();
        expiredPending.setId(55L);
        expiredPending.setProject(project);
        expiredPending.setEmail("laithithanhxuan.06wq@gmail.com");
        expiredPending.setStatus(InvitationStatus.PENDING);
        expiredPending.setExpiresAt(LocalDateTime.now().minusMinutes(5));

        when(projectRepository.findById(120L)).thenReturn(Optional.of(project));
        when(userRepository.findByEmailIgnoreCase("laithithanhxuan.06wq@gmail.com")).thenReturn(Optional.empty());
        when(invitationRepository.findByProjectIdAndEmailIgnoreCaseAndStatus(
                120L, "laithithanhxuan.06wq@gmail.com", InvitationStatus.PENDING))
                .thenReturn(Optional.of(expiredPending));
        when(invitationRepository.save(any(Invitation.class))).thenAnswer(i -> {
            Invitation saved = i.getArgument(0);
            saved.setId(57L);
            return saved;
        });

        Invitation created = invitationService.createInvitation(120L, req, pm);

        assertEquals(InvitationStatus.EXPIRED, expiredPending.getStatus());
        verify(invitationRepository, times(1)).saveAndFlush(expiredPending);
        assertEquals(57L, created.getId());
        assertEquals(InvitationStatus.PENDING, created.getStatus());
    }

    @Test
    @DisplayName("getInvitationForRecipient - Cho phép đúng email người nhận và chặn IDOR (403) khi khác email")
    public void testGetInvitationForRecipient_AntiIdorAndCancelledStatus() {
        Invitation revoked = new Invitation();
        revoked.setId(132L);
        revoked.setProject(project);
        revoked.setEmail("23110309@st.vju.ac.vn");
        revoked.setStatus(InvitationStatus.CANCELLED);
        revoked.setExpiresAt(LocalDateTime.now().plusDays(7));

        when(invitationRepository.findById(132L)).thenReturn(Optional.of(revoked));

        User rightUser = new User();
        rightUser.setId(9L);
        rightUser.setEmail("23110309@st.vju.ac.vn");

        Invitation fetched = invitationService.getInvitationForRecipient(132L, rightUser);
        assertEquals(InvitationStatus.CANCELLED, fetched.getStatus());

        // Tài khoản khác cố tình đọc lời mời #132 -> ném 403 FORBIDDEN, không lộ thông tin dự án
        BusinessException forbidden = assertThrows(BusinessException.class, () ->
                invitationService.getInvitationForRecipient(132L, pm));
        assertEquals(ErrorCode.FORBIDDEN, forbidden.getErrorCode());

        // Không tồn tại -> 404
        when(invitationRepository.findById(999L)).thenReturn(Optional.empty());
        assertThrows(ResourceNotFoundException.class, () ->
                invitationService.getInvitationForRecipient(999L, rightUser));
    }

    @Test
    @DisplayName("getAllMyInvitations & InvitationResponse.from - Đồng bộ đủ lịch sử và tự chuẩn hóa EXPIRED")
    public void testGetAllMyInvitationsAndExpiredNormalization() {
        Invitation stalePending = new Invitation();
        stalePending.setId(130L);
        stalePending.setProject(project);
        stalePending.setEmail("23110309@st.vju.ac.vn");
        stalePending.setStatus(InvitationStatus.PENDING);
        stalePending.setExpiresAt(LocalDateTime.now().minusHours(1));

        Invitation cancelled = new Invitation();
        cancelled.setId(132L);
        cancelled.setProject(project);
        cancelled.setEmail("23110309@st.vju.ac.vn");
        cancelled.setStatus(InvitationStatus.CANCELLED);
        cancelled.setExpiresAt(LocalDateTime.now().plusDays(6));

        when(invitationRepository.findByEmailIgnoreCaseOrderByIdDesc("23110309@st.vju.ac.vn"))
                .thenReturn(List.of(cancelled, stalePending));
        when(invitationRepository.findByEmailIgnoreCaseAndStatus("23110309@st.vju.ac.vn", InvitationStatus.PENDING))
                .thenReturn(List.of(stalePending));

        // getMyInvitations (chỉ lấy PENDING còn hạn) loại bỏ bản ghi đã quá hạn
        assertTrue(invitationService.getMyInvitations("23110309@st.vju.ac.vn").isEmpty());

        // getAllMyInvitations trả đầy đủ lịch sử và DTO tự chuyển stalePending -> EXPIRED
        List<Invitation> all = invitationService.getAllMyInvitations("23110309@st.vju.ac.vn");
        assertEquals(2, all.size());
        assertEquals("CANCELLED", InvitationResponse.from(all.get(0)).getStatus());
        assertEquals("EXPIRED", InvitationResponse.from(all.get(1)).getStatus());
    }
}
