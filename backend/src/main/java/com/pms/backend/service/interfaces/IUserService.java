package com.pms.backend.service.interfaces;

import com.pms.backend.dto.ChangePasswordRequest;
import com.pms.backend.dto.UpdateProfileRequest;
import com.pms.backend.model.User;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

public interface IUserService {
    User getUserById(Long id);
    User getUserByEmail(String email);
    User updateProfile(Long userId, UpdateProfileRequest request);
    String updateAvatar(Long userId, MultipartFile file);
    void changePassword(Long userId, ChangePasswordRequest request);
    List<User> searchUsers(String q, Long projectId);
}
