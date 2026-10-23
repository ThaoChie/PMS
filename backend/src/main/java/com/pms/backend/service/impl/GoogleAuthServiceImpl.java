package com.pms.backend.service.impl;

import com.pms.backend.service.interfaces.*;

import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdTokenVerifier;
import com.google.api.client.http.javanet.NetHttpTransport;
import com.google.api.client.json.gson.GsonFactory;
import com.pms.backend.config.AppProperties;
import com.pms.backend.dao.UserRepository;
import com.pms.backend.dto.GoogleLoginRequest;
import com.pms.backend.dto.TokenResponse;
import com.pms.backend.dto.UserResponse;
import com.pms.backend.enu.AuthProvider;
import com.pms.backend.enu.UserStatus;
import com.pms.backend.exception.UnauthorizedException;
import com.pms.backend.model.User;
import com.pms.backend.security.JwtTokenProvider;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Collections;
import java.util.Optional;

@Service
public class GoogleAuthServiceImpl implements IGoogleAuthService {

    @Value("${app.google.clientId:${GOOGLE_CLIENT_ID:YOUR_GOOGLE_CLIENT_ID}}")
    private String googleClientId;

    private final UserRepository userRepository;
    private final JwtTokenProvider tokenProvider;
    private final IRefreshTokenService refreshTokenService;
    private final AppProperties appProperties;

    public GoogleAuthServiceImpl(UserRepository userRepository,
                             JwtTokenProvider tokenProvider,
                             IRefreshTokenService refreshTokenService,
                             AppProperties appProperties) {
        this.userRepository = userRepository;
        this.tokenProvider = tokenProvider;
        this.refreshTokenService = refreshTokenService;
        this.appProperties = appProperties;
    }

    @Transactional
    public TokenResponse loginWithGoogle(GoogleLoginRequest request) {
        try {
            GoogleIdTokenVerifier verifier = new GoogleIdTokenVerifier.Builder(new NetHttpTransport(), new GsonFactory())
                    .setAudience(Collections.singletonList(googleClientId))
                    .build();

            GoogleIdToken idToken = verifier.verify(request.getIdToken());
            if (idToken == null) {
                // If verifier fails audience check in dev, we can verify email from payload if token is valid structure
                throw new UnauthorizedException("Google ID Token không hợp lệ hoặc đã hết hạn");
            }

            GoogleIdToken.Payload payload = idToken.getPayload();
            if (!Boolean.TRUE.equals(payload.getEmailVerified())) {
                throw new UnauthorizedException("Email Google chưa được xác thực (email_verified=false)");
            }

            String email = payload.getEmail().toLowerCase().trim();
            String name = (String) payload.get("name");
            String pictureUrl = (String) payload.get("picture");
            String sub = payload.getSubject();

            Optional<User> userOptional = userRepository.findByEmailIgnoreCase(email);
            User user;
            if (userOptional.isPresent()) {
                user = userOptional.get();
                // Link google_sub if local account exists (BR-AUTH-01)
                if (user.getGoogleSub() == null) {
                    user.setGoogleSub(sub);
                    userRepository.save(user);
                }
            } else {
                user = new User();
                user.setEmail(email);
                user.setFullName(name != null ? name : email);
                user.setAvatarUrl(pictureUrl);
                user.setProvider(AuthProvider.GOOGLE);
                user.setGoogleSub(sub);
                user.setStatus(UserStatus.ACTIVE);
                user = userRepository.save(user);
            }

            if (user.getStatus() == UserStatus.LOCKED) {
                throw new UnauthorizedException("Tài khoản của bạn đã bị khóa");
            }

            String accessToken = tokenProvider.generateToken(user.getId(), user.getEmail());
            String refreshToken = refreshTokenService.createRefreshToken(user);

            return new TokenResponse(
                    accessToken,
                    refreshToken,
                    appProperties.getJwt().getAccessTokenExpirationMs() / 1000,
                    UserResponse.from(user)
            );
        } catch (UnauthorizedException ue) {
            throw ue;
        } catch (Exception e) {
            throw new UnauthorizedException("Đăng nhập bằng Google thất bại: " + e.getMessage());
        }
    }
}
