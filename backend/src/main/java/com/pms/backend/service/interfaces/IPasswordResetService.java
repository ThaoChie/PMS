package com.pms.backend.service.interfaces;

public interface IPasswordResetService {
    void requestPasswordReset(String email);
    void resetPassword(String rawToken, String newPassword);
}
