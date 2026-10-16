package com.pms.backend.service;

import com.pms.backend.config.AppProperties;
import com.pms.backend.dao.RefreshTokenRepository;
import com.pms.backend.dao.UserRepository;
import com.pms.backend.dto.TokenResponse;
import com.pms.backend.dto.UserResponse;
import com.pms.backend.exception.UnauthorizedException;
import com.pms.backend.model.RefreshToken;
import com.pms.backend.model.User;
import com.pms.backend.security.JwtTokenProvider;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.LocalDateTime;
import java.util.Base64;
import java.util.UUID;

@Service
public class RefreshTokenService {

    private final RefreshTokenRepository refreshTokenRepository;
    private final UserRepository userRepository;
    private final JwtTokenProvider tokenProvider;
    private final AppProperties appProperties;

    public RefreshTokenService(RefreshTokenRepository refreshTokenRepository,
                               UserRepository userRepository,
                               JwtTokenProvider tokenProvider,
                               AppProperties appProperties) {
        this.refreshTokenRepository = refreshTokenRepository;
        this.userRepository = userRepository;
        this.tokenProvider = tokenProvider;
        this.appProperties = appProperties;
    }

    private String hashToken(String rawToken) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(rawToken.getBytes(StandardCharsets.UTF_8));
            return Base64.getEncoder().encodeToString(hash);
        } catch (NoSuchAlgorithmException e) {
            throw new RuntimeException("SHA-256 algorithm not found", e);
        }
    }

    @Transactional
    public String createRefreshToken(User user) {
        String rawToken = UUID.randomUUID().toString();
        String tokenHash = hashToken(rawToken);

        RefreshToken refreshToken = new RefreshToken();
        refreshToken.setUser(user);
        refreshToken.setTokenHash(tokenHash);
        refreshToken.setRevoked(false);
        refreshToken.setExpiresAt(LocalDateTime.now().plusSeconds(appProperties.getJwt().getRefreshTokenExpirationMs() / 1000));

        refreshTokenRepository.save(refreshToken);
        return rawToken;
    }

    @Transactional
    public TokenResponse rotateRefreshToken(String rawToken) {
        if (rawToken == null || rawToken.isBlank()) {
            throw new UnauthorizedException("Refresh token không hợp lệ");
        }

        String tokenHash = hashToken(rawToken);
        RefreshToken refreshToken = refreshTokenRepository.findByTokenHash(tokenHash)
                .orElseThrow(() -> new UnauthorizedException("Refresh token không tồn tại hoặc đã bị thu hồi"));

        if (refreshToken.isRevoked()) {
            throw new UnauthorizedException("Refresh token đã bị thu hồi");
        }

        if (refreshToken.getExpiresAt().isBefore(LocalDateTime.now())) {
            refreshTokenRepository.delete(refreshToken);
            throw new UnauthorizedException("Refresh token đã hết hạn");
        }

        // Revoke the old token (token rotation)
        refreshToken.setRevoked(true);
        refreshTokenRepository.save(refreshToken);

        User user = refreshToken.getUser();
        String newRawToken = createRefreshToken(user);
        String newAccessToken = tokenProvider.generateToken(user.getId(), user.getEmail());

        return new TokenResponse(
                newAccessToken,
                newRawToken,
                appProperties.getJwt().getAccessTokenExpirationMs() / 1000,
                UserResponse.from(user)
        );
    }

    @Transactional
    public void revokeToken(String rawToken) {
        if (rawToken != null && !rawToken.isBlank()) {
            String tokenHash = hashToken(rawToken);
            refreshTokenRepository.findByTokenHash(tokenHash).ifPresent(t -> {
                t.setRevoked(true);
                refreshTokenRepository.save(t);
            });
        }
    }
}
