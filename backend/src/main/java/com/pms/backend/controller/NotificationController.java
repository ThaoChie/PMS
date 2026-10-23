package com.pms.backend.controller;

import com.pms.backend.common.ApiResponse;
import com.pms.backend.dao.NotificationRepository;
import com.pms.backend.dto.NotificationResponse;
import com.pms.backend.enu.NotificationGroup;
import com.pms.backend.model.Notification;
import com.pms.backend.model.User;
import com.pms.backend.service.interfaces.IUserService;
import com.pms.backend.wrapper.PageWrapper;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping({"/api/notifications", "/notifications"})
@PreAuthorize("isAuthenticated()")
public class NotificationController {

    private final NotificationRepository notificationRepository;
    private final IUserService userService;

    public NotificationController(NotificationRepository notificationRepository, IUserService userService) {
        this.notificationRepository = notificationRepository;
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

        NotificationGroup nGroup = NotificationGroup.fromString(group);
        Page<Notification> pageResult;

        if (nGroup != null && Boolean.TRUE.equals(unread)) {
            pageResult = notificationRepository.findByRecipientIdAndIsReadAndTypeInOrderByCreatedAtDesc(
                    user.getId(), false, nGroup.getNotificationTypes(), pageable);
        } else if (nGroup != null) {
            pageResult = notificationRepository.findByRecipientIdAndTypeInOrderByCreatedAtDesc(
                    user.getId(), nGroup.getNotificationTypes(), pageable);
        } else if (Boolean.TRUE.equals(unread)) {
            pageResult = notificationRepository.findByRecipientIdAndIsReadOrderByCreatedAtDesc(
                    user.getId(), false, pageable);
        } else {
            pageResult = notificationRepository.findByRecipientIdOrderByCreatedAtDesc(
                    user.getId(), pageable);
        }

        Page<NotificationResponse> dtoPage = pageResult.map(NotificationResponse::from);
        return ApiResponse.success(PageWrapper.from(dtoPage));
    }

    @GetMapping("/unread-count")
    public ApiResponse<Map<String, Long>> getUnreadCount() {
        User user = getCurrentUser();
        long count = notificationRepository.countByRecipientIdAndIsReadFalse(user.getId());
        return ApiResponse.success(Map.of("count", count));
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
        notificationRepository.findById(id).ifPresent(n -> {
            if (n.getRecipient() != null && n.getRecipient().getId().equals(user.getId())) {
                n.setRead(true);
                notificationRepository.save(n);
            }
        });
        return ApiResponse.success(null);
    }

    @PostMapping("/read-all")
    @Transactional
    public ApiResponse<Void> markAllAsRead() {
        User user = getCurrentUser();
        notificationRepository.markAllAsReadForUser(user.getId());
        return ApiResponse.success(null);
    }
}
