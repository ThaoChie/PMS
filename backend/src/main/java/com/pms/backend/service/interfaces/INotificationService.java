package com.pms.backend.service.interfaces;

import com.pms.backend.enu.NotificationType;
import com.pms.backend.model.Notification;
import com.pms.backend.model.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;

public interface INotificationService {

    void notify(NotificationType type, List<User> recipients, String title, String message, String link, String data, User sender);

    /**
     * Lấy thông báo của một người dùng, có thể lọc theo nhóm và theo trạng thái chưa đọc.
     *
     * @param group tên nhóm thông báo (mention/assignment/workflow/approval/invite); null = tất cả
     * @param unread true = chỉ lấy thông báo chưa đọc; null/false = lấy tất cả
     */
    Page<Notification> getNotifications(Long recipientId, String group, Boolean unread, Pageable pageable);

    /** Đếm số thông báo chưa đọc của người dùng. */
    long countUnread(Long recipientId);

    /** Đánh dấu một thông báo đã đọc; chỉ có tác dụng nếu thông báo thuộc về người dùng này. */
    void markAsRead(Long notificationId, Long recipientId);

    /** Đánh dấu toàn bộ thông báo của người dùng là đã đọc. */
    void markAllAsRead(Long recipientId);
}
