package com.pms.backend.controller;

import com.pms.backend.common.ApiResponse;
import com.pms.backend.config.AppProperties;
import com.pms.backend.dto.*;
import com.pms.backend.security.RefreshCookieUtil;
import com.pms.backend.service.AuthService;
import com.pms.backend.service.GoogleAuthService;
import com.pms.backend.service.PasswordResetService;
import com.pms.backend.service.RefreshTokenService;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;
    private final GoogleAuthService googleAuthService;
    private final RefreshTokenService refreshTokenService;
    private final PasswordResetService passwordResetService;
    private final RefreshCookieUtil refreshCookieUtil;
    private final AppProperties appProperties;

    public AuthController(AuthService authService,
                          GoogleAuthService googleAuthService,
                          RefreshTokenService refreshTokenService,
                          PasswordResetService passwordResetService,
                          RefreshCookieUtil refreshCookieUtil,
                          AppProperties appProperties) {
        this.authService = authService;
        this.googleAuthService = googleAuthService;
        this.refreshTokenService = refreshTokenService;
        this.passwordResetService = passwordResetService;
        this.refreshCookieUtil = refreshCookieUtil;
        this.appProperties = appProperties;
    }

    private void attachRefreshCookie(HttpServletResponse response, String refreshToken) {
        ResponseCookie cookie = refreshCookieUtil.createRefreshCookie(
                refreshToken,
                appProperties.getJwt().getRefreshTokenExpirationMs()
        );
        response.addHeader(HttpHeaders.SET_COOKIE, cookie.toString());
    }

    private String extractRefreshCookie(HttpServletRequest request) {
        if (request.getCookies() != null) {
            for (Cookie cookie : request.getCookies()) {
                if (RefreshCookieUtil.REFRESH_COOKIE_NAME.equals(cookie.getName())) {
                    return cookie.getValue();
                }
            }
        }
        return null;
    }

    @PostMapping("/login")
    public ApiResponse<TokenResponse> login(@Valid @RequestBody LoginRequest request, HttpServletResponse response) {
        TokenResponse tokenResponse = authService.login(request);
        attachRefreshCookie(response, tokenResponse.getRefreshToken());
        return ApiResponse.success(tokenResponse);
    }

    @PostMapping("/google")
    public ApiResponse<TokenResponse> googleLogin(@Valid @RequestBody GoogleLoginRequest request, HttpServletResponse response) {
        TokenResponse tokenResponse = googleAuthService.loginWithGoogle(request);
        attachRefreshCookie(response, tokenResponse.getRefreshToken());
        return ApiResponse.success(tokenResponse);
    }

    @PostMapping("/register")
    public ApiResponse<UserResponse> register(@Valid @RequestBody RegisterRequest request) {
        UserResponse response = authService.register(request);
        return ApiResponse.success(response);
    }

    @PostMapping("/refresh")
    public ApiResponse<TokenResponse> refresh(HttpServletRequest request,
                                             HttpServletResponse response,
                                             @RequestBody(required = false) TokenResponse body) {
        String token = extractRefreshCookie(request);
        if (token == null && body != null) {
            token = body.getRefreshToken();
        }

        TokenResponse tokenResponse = refreshTokenService.rotateRefreshToken(token);
        attachRefreshCookie(response, tokenResponse.getRefreshToken());
        return ApiResponse.success(tokenResponse);
    }

    @PostMapping("/logout")
    public ApiResponse<String> logout(HttpServletRequest request, HttpServletResponse response) {
        String token = extractRefreshCookie(request);
        refreshTokenService.revokeToken(token);

        ResponseCookie cookie = refreshCookieUtil.deleteRefreshCookie();
        response.addHeader(HttpHeaders.SET_COOKIE, cookie.toString());
        return ApiResponse.success("Đăng xuất thành công");
    }

    @PostMapping("/forgot-password")
    public ApiResponse<String> forgotPassword(@Valid @RequestBody ForgotPasswordRequest request) {
        passwordResetService.requestPasswordReset(request.getEmail());
        return ApiResponse.success("Nếu email tồn tại trong hệ thống, hướng dẫn đặt lại mật khẩu đã được gửi đến bạn.");
    }

    @PostMapping("/reset-password")
    public ApiResponse<String> resetPassword(@Valid @RequestBody ResetPasswordRequest request) {
        passwordResetService.resetPassword(request.getToken(), request.getNewPassword());
        return ApiResponse.success("Mật khẩu của bạn đã được đặt lại thành công. Vui lòng đăng nhập lại.");
    }
}
