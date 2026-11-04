package com.pms.backend.controller;

import com.pms.backend.common.ApiResponse;
import com.pms.backend.dto.NotificationResponse;
import com.pms.backend.model.Notification;
import com.pms.backend.model.User;
import com.pms.backend.service.interfaces.INotificationService;
import com.pms.backend.service.interfaces.IUserService;
import com.pms.backend.wrapper.PageWrapper;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * UC019 — Notification Center.
 * Controller chỉ điều phối request/response; mọi truy vấn dữ liệu nằm ở {@link INotificationService}
 * theo quy tắc phân lớp controller → service → repository (project_structure.md mục 3.2).
 */
@RestController
@RequestMapping({"/api/notifications", "/notifications"})
@PreAuthorize("isAuthenticated()")
public class NotificationController {

    private final INotificationService notificationService;
    private final IUserService userService;

    public NotificationController(INotificationService notificationService, IUserService userService) {
        this.notificationService = notificationService;
        this.userService = userService;
    }

    private User getCurrentUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        return userService.getUserByEmail(auth.getName());
    }

    @GetMapping
    public ApiResponse<PageWrapper<NotificationResponse>> getNotifications(
            @RequestParam(required = false) String group,
            @RequestParam(required = false) Boolean unread,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        User user = getCurrentUser();
        Pageable pageable = PageRequest.of(page, size);

        Page<Notification> pageResult = notificationService.getNotifications(
                user.getId(), group, unread, pageable);

        Page<NotificationResponse> dtoPage = pageResult.map(NotificationResponse::from);
        return ApiResponse.success(PageWrapper.from(dtoPage));
    }

    @GetMapping("/unread-count")
    public ApiResponse<Map<String, Long>> getUnreadCount() {
        User user = getCurrentUser();
        return ApiResponse.success(Map.of("count", notificationService.countUnread(user.getId())));
    }

    @PostMapping("/{id}/read")
    public ApiResponse<Void> markAsReadPost(@PathVariable Long id) {
        return markAsRead(id);
    }

    @PutMapping("/{id}/read")
    public ApiResponse<Void> markAsReadPut(@PathVariable Long id) {
        return markAsRead(id);
    }

    private ApiResponse<Void> markAsRead(Long id) {
        User user = getCurrentUser();
        notificationService.markAsRead(id, user.getId());
        return ApiResponse.success(null);
    }

    @PostMapping("/read-all")
    public ApiResponse<Void> markAllAsRead() {
        User user = getCurrentUser();
        notificationService.markAllAsRead(user.getId());
        return ApiResponse.success(null);
    }

    @PutMapping("/read-all")
    public ApiResponse<Void> markAllAsReadPut() {
        return markAllAsRead();
    }
}
