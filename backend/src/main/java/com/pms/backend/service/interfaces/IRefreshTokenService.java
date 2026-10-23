package com.pms.backend.service.interfaces;

import com.pms.backend.dto.TokenResponse;
import com.pms.backend.model.User;

public interface IRefreshTokenService {
    String createRefreshToken(User user);
    TokenResponse rotateRefreshToken(String rawToken);
    void revokeToken(String rawToken);
}
