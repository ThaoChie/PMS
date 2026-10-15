package com.pms.backend.controller;

import com.pms.backend.common.ApiResponse;
import com.pms.backend.dao.NotificationRepository;
import com.pms.backend.model.Notification;
import com.pms.backend.service.UserService;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping({"/api/notifications", "/notifications"})
public class NotificationController {

    private final NotificationRepository notificationRepository;
    private final UserService userService;

    public NotificationController(NotificationRepository notificationRepository, UserService userService) {
        this.notificationRepository = notificationRepository;
        this.userService = userService;
    }

    @GetMapping
    public ApiResponse<List<Notification>> getNotifications() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        Long userId = userService.getUserByEmail(auth.getName()).getId();
        return ApiResponse.success(notificationRepository.findByUserIdOrderByCreatedAtDesc(userId));
    }

    @PutMapping("/{id}/read")
    public ApiResponse<String> markAsRead(@PathVariable Long id) {
        Notification notification = notificationRepository.findById(id).orElseThrow();
        notification.setRead(true);
        notificationRepository.save(notification);
        return ApiResponse.success("Marked as read");
    }
}
