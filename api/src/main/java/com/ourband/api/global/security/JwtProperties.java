package com.ourband.api.global.security;

import org.springframework.boot.context.properties.ConfigurationProperties;

// application.properties의 "jwt.xxx" 값들을 이 Record에 자동으로 매핑합니다.
@ConfigurationProperties(prefix = "jwt")
public record JwtProperties(
    String secret,
    long expiration,
    long refreshExpiration
) {
}