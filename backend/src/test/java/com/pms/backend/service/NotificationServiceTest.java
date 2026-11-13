package com.pms.backend.service;

import com.pms.backend.dao.NotificationRepository;
import com.pms.backend.enu.NotificationType;
import com.pms.backend.exception.ResourceNotFoundException;
import com.pms.backend.model.Notification;
import com.pms.backend.model.User;
import com.pms.backend.service.impl.NotificationServiceImpl;
import com.pms.backend.service.interfaces.IMailService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

/** UC019 — kiểm thử nghiệp vụ thông báo (tạo, đọc, lọc theo nhóm, chống IDOR). */
@ExtendWith(MockitoExtension.class)
public class NotificationServiceTest {

    @Mock private NotificationRepository notificationRepository;
    @Mock private IMailService mailService;
    @Mock private com.pms.backend.config.AppProperties appProperties;

    @InjectMocks
    private NotificationServiceImpl notificationService;

    private User actor;
    private User recipient;

    @BeforeEach
    void setup() {
        actor = new User();
        actor.setId(100L);
        actor.setFullName("Người thao tác");
        actor.setEmail("actor@example.com");

        recipient = new User();
        recipient.setId(200L);
        recipient.setFullName("Người nhận");
        recipient.setEmail("recipient@example.com");
    }

    @Test
    void notify_khongGuiThongBaoChoChinhNguoiThaoTac() {
        notificationService.notify(
                NotificationType.ASSIGNED, List.of(actor), "Tiêu đề", "Nội dung", "/issues/TEST-1", "TEST-1", actor);

        verify(notificationRepository, never()).save(any(Notification.class));
        verify(mailService, never()).sendMailAsync(anyString(), anyString(), anyString(), anyMap());
    }

    @Test
    void notify_luuThongBaoVaGuiEmailChoNguoiKhac() {
        notificationService.notify(
                NotificationType.MENTION, List.of(recipient), "Bạn được nhắc tên", "Nội dung", "/issues/TEST-1", "TEST-1", actor);

        ArgumentCaptor<Notification> captor = ArgumentCaptor.forClass(Notification.class);
        verify(notificationRepository, times(1)).save(captor.capture());

        Notification saved = captor.getValue();
        assertEquals(recipient, saved.getRecipient());
        assertEquals(actor, saved.getSender());
        assertEquals(NotificationType.MENTION, saved.getType());
        assertFalse(saved.isRead());

        verify(mailService, times(1))
                .sendMailAsync(eq("recipient@example.com"), anyString(), eq("notification"), anyMap());
    }

    @Test
    void notify_loiGuiEmailKhongLamHongGiaoDichChinh() {
        doThrow(new RuntimeException("SMTP lỗi"))
                .when(mailService).sendMailAsync(anyString(), anyString(), anyString(), anyMap());

        assertDoesNotThrow(() -> notificationService.notify(
                NotificationType.STATUS_CHANGED, List.of(recipient), "Tiêu đề", "Nội dung", null, null, actor));

        verify(notificationRepository, times(1)).save(any(Notification.class));
    }

    @Test
    void markAsRead_chiChuSoHuuMoiDanhDauDuocDaDoc() {
        Notification other = new Notification();
        other.setRecipient(recipient);
        other.setRead(false);

        when(notificationRepository.findById(7L)).thenReturn(Optional.of(other));

        // Người khác (id 999) đánh dấu -> 404 (ResourceNotFound), dữ liệu không đổi
        assertThrows(ResourceNotFoundException.class, () -> notificationService.markAsRead(7L, 999L));
        assertFalse(other.isRead());
        verify(notificationRepository, never()).save(any(Notification.class));

        // Chủ sở hữu đánh dấu -> thành công
        notificationService.markAsRead(7L, recipient.getId());
        assertTrue(other.isRead());
        verify(notificationRepository, times(1)).save(other);
    }

    @Test
    void markAsRead_thongBaoKhongTonTai_tra404() {
        when(notificationRepository.findById(404L)).thenReturn(Optional.empty());
        assertThrows(ResourceNotFoundException.class, () -> notificationService.markAsRead(404L, 1L));
        verify(notificationRepository, never()).save(any(Notification.class));
    }

    @Test
    void getNotifications_locTheoNhomVaChuaDoc() {
        Pageable pageable = PageRequest.of(0, 20);
        Page<Notification> empty = new PageImpl<>(List.of());

        when(notificationRepository.findByRecipientIdAndIsReadAndTypeInOrderByCreatedAtDesc(
                eq(200L), eq(false), anyCollection(), eq(pageable))).thenReturn(empty);

        notificationService.getNotifications(200L, "mention", true, pageable);

        verify(notificationRepository, times(1))
                .findByRecipientIdAndIsReadAndTypeInOrderByCreatedAtDesc(eq(200L), eq(false), anyCollection(), eq(pageable));
    }

    @Test
    void getNotifications_khongLocThiLayTatCa() {
        Pageable pageable = PageRequest.of(0, 20);
        when(notificationRepository.findByRecipientIdOrderByCreatedAtDesc(200L, pageable))
                .thenReturn(new PageImpl<>(List.of()));

        notificationService.getNotifications(200L, null, null, pageable);

        verify(notificationRepository, times(1)).findByRecipientIdOrderByCreatedAtDesc(200L, pageable);
    }

    @Test
    void countUnread_vaMarkAllAsRead_uyQuyenChoRepository() {
        when(notificationRepository.countByRecipientIdAndIsReadFalse(200L)).thenReturn(5L);
        assertEquals(5L, notificationService.countUnread(200L));

        notificationService.markAllAsRead(200L);
        verify(notificationRepository, times(1)).markAllAsReadForUser(200L);
    }
}
