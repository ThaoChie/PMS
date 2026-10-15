package com.pms.backend.controller;

import com.pms.backend.common.ApiResponse;
import com.pms.backend.dto.ChangePasswordRequest;
import com.pms.backend.dto.UpdateProfileRequest;
import com.pms.backend.dto.UserResponse;
import com.pms.backend.model.User;
import com.pms.backend.security.AuthUserPrincipal;
import com.pms.backend.service.UserService;
import jakarta.validation.Valid;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/users")
public class UserController {

    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    private Long getCurrentUserId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.getPrincipal() instanceof AuthUserPrincipal principal) {
            return principal.getId();
        }
        throw new IllegalStateException("User not authenticated");
    }

    @GetMapping("/me")
    public ApiResponse<UserResponse> getCurrentUser() {
        User user = userService.getUserById(getCurrentUserId());
        return ApiResponse.success(UserResponse.from(user));
    }

    @PutMapping("/me")
    public ApiResponse<UserResponse> updateProfile(@Valid @RequestBody UpdateProfileRequest request) {
        User user = userService.updateProfile(getCurrentUserId(), request);
        return ApiResponse.success(UserResponse.from(user));
    }

    @PostMapping("/me/avatar")
    public ApiResponse<Map<String, String>> updateAvatar(@RequestParam("avatar") MultipartFile file) {
        String avatarUrl = userService.updateAvatar(getCurrentUserId(), file);
        return ApiResponse.success(Map.of("avatarUrl", avatarUrl));
    }

    @PutMapping("/me/password")
    public ApiResponse<String> changePasswordPut(@Valid @RequestBody ChangePasswordRequest request) {
        userService.changePassword(getCurrentUserId(), request);
        return ApiResponse.success("Đổi mật khẩu thành công");
    }

    @PostMapping("/me/password")
    public ApiResponse<String> changePasswordPost(@Valid @RequestBody ChangePasswordRequest request) {
        userService.changePassword(getCurrentUserId(), request);
        return ApiResponse.success("Đổi mật khẩu thành công");
    }

    @GetMapping("/search")
    public ApiResponse<List<UserResponse>> searchUsers(@RequestParam(required = false) String q,
                                                       @RequestParam(required = false) Long projectId) {
        List<User> users = userService.searchUsers(q, projectId);
        return ApiResponse.success(users.stream().map(UserResponse::from).collect(Collectors.toList()));
    }
}
