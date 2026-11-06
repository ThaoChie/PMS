package com.pms.backend.service.impl;

import com.pms.backend.service.interfaces.*;

import com.pms.backend.dao.NotificationRepository;
import com.pms.backend.enu.NotificationGroup;
import com.pms.backend.enu.NotificationType;
import com.pms.backend.model.Notification;
import com.pms.backend.model.User;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;

@Service
public class NotificationServiceImpl implements INotificationService {

    private static final Logger log = LoggerFactory.getLogger(NotificationServiceImpl.class);

    private final NotificationRepository notificationRepository;
    private final IMailService mailService;

    public NotificationServiceImpl(NotificationRepository notificationRepository, IMailService mailService) {
        this.notificationRepository = notificationRepository;
        this.mailService = mailService;
    }

    @Override
    @Transactional(readOnly = true)
    public Page<Notification> getNotifications(Long recipientId, String group, Boolean unread, Pageable pageable) {
        NotificationGroup nGroup = NotificationGroup.fromString(group);
        boolean onlyUnread = Boolean.TRUE.equals(unread);

        if (nGroup != null && onlyUnread) {
            return notificationRepository.findByRecipientIdAndIsReadAndTypeInOrderByCreatedAtDesc(
                    recipientId, false, nGroup.getNotificationTypes(), pageable);
        }
        if (nGroup != null) {
            return notificationRepository.findByRecipientIdAndTypeInOrderByCreatedAtDesc(
                    recipientId, nGroup.getNotificationTypes(), pageable);
        }
        if (onlyUnread) {
            return notificationRepository.findByRecipientIdAndIsReadOrderByCreatedAtDesc(
                    recipientId, false, pageable);
        }
        return notificationRepository.findByRecipientIdOrderByCreatedAtDesc(recipientId, pageable);
    }

    @Override
    @Transactional(readOnly = true)
    public long countUnread(Long recipientId) {
        return notificationRepository.countByRecipientIdAndIsReadFalse(recipientId);
    }

    @Override
    @Transactional
    public void markAsRead(Long notificationId, Long recipientId) {
        notificationRepository.findById(notificationId).ifPresent(n -> {
            // Chống IDOR: chỉ chủ sở hữu thông báo mới được đánh dấu đã đọc
            if (n.getRecipient() != null && n.getRecipient().getId().equals(recipientId)) {
                n.setRead(true);
                notificationRepository.save(n);
            }
        });
    }

    @Override
    @Transactional
    public void markAllAsRead(Long recipientId) {
        notificationRepository.markAllAsReadForUser(recipientId);
    }

    @Override
    @Transactional
    public void notify(NotificationType type, List<User> recipients, String title, String message, String link, String data, User sender) {
        if (recipients == null || recipients.isEmpty()) {
            return;
        }

        for (User recipient : recipients) {
            // Do not notify self
            if (sender != null && sender.getId() != null && sender.getId().equals(recipient.getId())) {
                continue;
            }

            try {
                Notification notification = new Notification();
                notification.setRecipient(recipient);
                notification.setSender(sender);
                notification.setType(type);
                notification.setTitle(title);
                notification.setMessage(message);
                notification.setLink(link);
                notification.setData(data);
                notification.setRead(false);

                notificationRepository.save(notification);

                // Dispatch email
                if (recipient.getEmail() != null) {
                    mailService.sendMailAsync(
                            recipient.getEmail(),
                            "[EPMS] " + title,
                            "notification",
                            Map.of(
                                    "recipientName", recipient.getFullName(),
                                    "title", title,
                                    "message", message != null ? message : "",
                                    "link", link != null ? link : "#"
                            )
                    );
                }
            } catch (Exception ex) {
                log.error("Failed to deliver notification to user {}", recipient.getId(), ex);
            }
        }
    }
}
