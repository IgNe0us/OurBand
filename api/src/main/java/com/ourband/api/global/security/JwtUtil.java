package com.ourband.api.global.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Component;

import java.security.Key;
import java.util.Date;
import java.util.UUID;

@Component
@RequiredArgsConstructor
public class JwtUtil {

    private final JwtProperties jwtProperties;
    private final StringRedisTemplate stringRedisTemplate;
    private Key secretKey;

    @PostConstruct
    public void init() {
        // Record의 getter인 secret()을 호출해서 값을 꺼냅니다.
        this.secretKey = Keys.hmacShaKeyFor(jwtProperties.secret().getBytes());
    }

    public String generateToken(Long userId, String email, String type) {
        Date now = new Date();
        // Record의 getter인 expiration()을 호출해서 값을 꺼냅니다.
        Date expiryDate = new Date(now.getTime() + jwtProperties.expiration());

        return Jwts.builder()
                .setSubject(email)
                .claim("userId", userId)
                .claim("type", type)
                .setIssuedAt(now)
                .setExpiration(expiryDate)
                .signWith(secretKey, SignatureAlgorithm.HS256)
                .compact();
    }

    public String generateRefreshToken(Long userId) {
        String refreshToken = UUID.randomUUID().toString();
        // Redis에 Refresh Token 저장 (Key: token, Value: userId)
        stringRedisTemplate.opsForValue().set(
                "refresh_token_id:" + refreshToken,
                userId.toString(),
                jwtProperties.refreshExpiration(),
                java.util.concurrent.TimeUnit.MILLISECONDS
        );
        return refreshToken;
    }

    public void invalidateToken(String token) {
        try {
            Claims claims = Jwts.parserBuilder()
                    .setSigningKey(secretKey)
                    .build()
                    .parseClaimsJws(token)
                    .getBody();
            Date expiration = claims.getExpiration();
            long timeToLive = expiration.getTime() - System.currentTimeMillis();
            if (timeToLive > 0) {
                stringRedisTemplate.opsForValue().set("blacklist:" + token, "true", timeToLive, java.util.concurrent.TimeUnit.MILLISECONDS);
            }
        } catch (Exception e) {
            // 이미 만료되었거나 잘못된 토큰이면 무시
        }
    }

    public void deleteRefreshToken(String refreshToken) {
        stringRedisTemplate.delete("refresh_token_id:" + refreshToken);
    }

    public boolean validateToken(String token) {
        try {
            // 블랙리스트 확인
            String isBlacklisted = stringRedisTemplate.opsForValue().get("blacklist:" + token);
            if ("true".equals(isBlacklisted)) {
                return false;
            }

            Jwts.parserBuilder()
                    .setSigningKey(secretKey)
                    .build()
                    .parseClaimsJws(token);

            return true;

        } catch (Exception e) {
            return false;
        }
    }

    public Long getUserId(String token) {

        Claims claims = Jwts.parserBuilder()
                .setSigningKey(secretKey)
                .build()
                .parseClaimsJws(token)
                .getBody();

        return claims.get("userId", Long.class);
    }
}