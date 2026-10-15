package com.pms.backend.service;

import com.pms.backend.dao.UserRepository;
import com.pms.backend.dto.ChangePasswordRequest;
import com.pms.backend.dto.UpdateProfileRequest;
import com.pms.backend.enu.AuthProvider;
import com.pms.backend.exception.BusinessException;
import com.pms.backend.exception.ResourceNotFoundException;
import com.pms.backend.model.User;
import com.pms.backend.util.FileValidator;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@Service
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final FileStorageService fileStorageService;
    private final FileValidator fileValidator;

    public UserService(UserRepository userRepository,
                       PasswordEncoder passwordEncoder,
                       FileStorageService fileStorageService,
                       FileValidator fileValidator) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.fileStorageService = fileStorageService;
        this.fileValidator = fileValidator;
    }

    public User getUserById(Long id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy người dùng với ID: " + id));
    }

    public User getUserByEmail(String email) {
        return userRepository.findByEmailIgnoreCase(email)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy người dùng với email: " + email));
    }

    @Transactional
    public User updateProfile(Long userId, UpdateProfileRequest request) {
        User user = getUserById(userId);
        user.setFullName(request.getFullName().trim());
        return userRepository.save(user);
    }

    @Transactional
    public String updateAvatar(Long userId, MultipartFile file) {
        fileValidator.validateImage(file);
        String fileName = fileStorageService.uploadFile(file);
        String fileUrl = fileStorageService.getFileUrl(fileName);

        User user = getUserById(userId);
        user.setAvatarUrl(fileUrl);
        userRepository.save(user);

        return fileUrl;
    }

    @Transactional
    public void changePassword(Long userId, ChangePasswordRequest request) {
        User user = getUserById(userId);

        if (user.getProvider() == AuthProvider.GOOGLE) {
            throw new BusinessException("Tài khoản đăng nhập bằng Google không thể đổi mật khẩu tại đây");
        }

        String oldPass = request.getOldPassword();
        if (oldPass == null || !passwordEncoder.matches(oldPass, user.getPassword())) {
            throw new BusinessException("Mật khẩu hiện tại không chính xác");
        }

        if (request.getNewPassword() == null || request.getNewPassword().length() < 6) {
            throw new BusinessException("Mật khẩu mới phải có ít nhất 6 ký tự");
        }

        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);
    }

    public List<User> searchUsers(String q, Long projectId) {
        String keyword = q != null ? q.trim() : "";
        if (projectId != null) {
            return userRepository.searchProjectMembers(projectId, keyword);
        }
        return userRepository.searchUsers(keyword);
    }
}
