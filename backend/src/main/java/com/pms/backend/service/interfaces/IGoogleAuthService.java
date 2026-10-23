package com.pms.backend.service.interfaces;

import com.pms.backend.dto.GoogleLoginRequest;
import com.pms.backend.dto.TokenResponse;

public interface IGoogleAuthService {
    TokenResponse loginWithGoogle(GoogleLoginRequest request);
}
