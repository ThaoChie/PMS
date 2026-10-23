package com.pms.backend.service.impl;

import com.pms.backend.service.interfaces.*;

import com.pms.backend.dao.NotificationRepository;
import com.pms.backend.enu.NotificationType;
import com.pms.backend.model.Notification;
import com.pms.backend.model.User;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
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
