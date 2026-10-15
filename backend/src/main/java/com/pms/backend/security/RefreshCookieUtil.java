package com.pms.backend.security;

import org.springframework.http.ResponseCookie;
import org.springframework.stereotype.Component;

import java.time.Duration;

@Component
public class RefreshCookieUtil {

    public static final String REFRESH_COOKIE_NAME = "refresh_token";

    public ResponseCookie createRefreshCookie(String token, long maxAgeMs) {
        return ResponseCookie.from(REFRESH_COOKIE_NAME, token)
                .httpOnly(true)
                .secure(false) // Set to true in HTTPS production
                .sameSite("Strict")
                .path("/api/auth")
                .maxAge(Duration.ofMillis(maxAgeMs))
                .build();
    }

    public ResponseCookie deleteRefreshCookie() {
        return ResponseCookie.from(REFRESH_COOKIE_NAME, "")
                .httpOnly(true)
                .secure(false)
                .sameSite("Strict")
                .path("/api/auth")
                .maxAge(0)
                .build();
    }
}
