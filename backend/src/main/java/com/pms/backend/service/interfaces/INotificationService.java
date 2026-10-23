package com.pms.backend.service.interfaces;

import com.pms.backend.enu.NotificationType;
import com.pms.backend.model.User;

import java.util.List;

public interface INotificationService {
    void notify(NotificationType type, List<User> recipients, String title, String message, String link, String data, User sender);
}
