package com.pms.backend.service.interfaces;

import com.pms.backend.dto.LoginRequest;
import com.pms.backend.dto.RegisterRequest;
import com.pms.backend.dto.TokenResponse;
import com.pms.backend.dto.UserResponse;

public interface IAuthService {
    TokenResponse login(LoginRequest request);
    UserResponse register(RegisterRequest request);
}
