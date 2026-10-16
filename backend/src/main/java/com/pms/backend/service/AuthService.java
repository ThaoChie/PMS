package com.pms.backend.service;

import com.pms.backend.config.AppProperties;
import com.pms.backend.dao.UserRepository;
import com.pms.backend.dto.LoginRequest;
import com.pms.backend.dto.RegisterRequest;
import com.pms.backend.dto.TokenResponse;
import com.pms.backend.dto.UserResponse;
import com.pms.backend.enu.AuthProvider;
import com.pms.backend.enu.UserStatus;
import com.pms.backend.exception.BusinessException;
import com.pms.backend.exception.UnauthorizedException;
import com.pms.backend.model.User;
import com.pms.backend.security.JwtTokenProvider;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider tokenProvider;
    private final RefreshTokenService refreshTokenService;
    private final AppProperties appProperties;
    private final com.pms.backend.security.LoginRateLimiter loginRateLimiter;

    public AuthService(UserRepository userRepository,
                       PasswordEncoder passwordEncoder,
                       JwtTokenProvider tokenProvider,
                       RefreshTokenService refreshTokenService,
                       AppProperties appProperties,
                       com.pms.backend.security.LoginRateLimiter loginRateLimiter) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.tokenProvider = tokenProvider;
        this.refreshTokenService = refreshTokenService;
        this.appProperties = appProperties;
        this.loginRateLimiter = loginRateLimiter;
    }

    @Transactional
    public TokenResponse login(LoginRequest request) {
        String email = request.getEmail() != null ? request.getEmail().trim().toLowerCase() : "";
        loginRateLimiter.checkBlocked(email);

        User user = userRepository.findByEmailIgnoreCase(email)
                .orElse(null);

        if (user == null || user.getPassword() == null || !passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            loginRateLimiter.recordFailedAttempt(email);
            throw new UnauthorizedException("Email và/hoặc mật khẩu chưa đúng");
        }

        if (user.getStatus() == UserStatus.LOCKED) {
            throw new UnauthorizedException("Tài khoản của bạn đã bị khóa. Vui lòng liên hệ quản trị viên.");
        }

        loginRateLimiter.recordSuccess(email);

        String accessToken = tokenProvider.generateToken(user.getId(), user.getEmail());
        String refreshToken = refreshTokenService.createRefreshToken(user);

        return new TokenResponse(
                accessToken,
                refreshToken,
                appProperties.getJwt().getAccessTokenExpirationMs() / 1000,
                UserResponse.from(user)
        );
    }

    @Transactional
    public UserResponse register(RegisterRequest request) {
        String email = request.getEmail() != null ? request.getEmail().trim().toLowerCase() : "";
        if (userRepository.findByEmailIgnoreCase(email).isPresent()) {
            throw new BusinessException("Email này đã được đăng ký trong hệ thống");
        }

        User user = new User();
        user.setEmail(email);
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        String rawName = request.getFullName();
        if (rawName == null || rawName.isBlank()) {
            rawName = request.getName();
        }
        if (rawName == null || rawName.isBlank()) {
            rawName = email.contains("@") ? email.substring(0, email.indexOf("@")) : "Thành viên";
        }
        user.setFullName(rawName.trim());
        user.setProvider(AuthProvider.LOCAL);
        user.setStatus(UserStatus.ACTIVE);

        user = userRepository.save(user);
        return UserResponse.from(user);
    }
}
