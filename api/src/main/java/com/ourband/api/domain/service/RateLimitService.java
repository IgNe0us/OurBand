package com.ourband.api.domain.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.time.Duration;

@Slf4j
@Service
@RequiredArgsConstructor
public class RateLimitService {

    private final StringRedisTemplate redisTemplate;
    
    // 1분 내 최대 3회 허용
    private static final int MAX_REQUESTS_PER_MINUTE = 3;
    private static final long TIME_WINDOW_SECONDS = 60;

    /**
     * IP 기반 요청 횟수를 체크합니다.
     * @param ip 클라이언트 IP
     * @param action 어떤 액션인지 (예: "email_send")
     * @return 허용 여부 (true = 허용, false = 차단)
     */
    public boolean isAllowed(String ip, String action) {
        String key = "rate_limit:" + action + ":" + ip;
        
        Long count = redisTemplate.opsForValue().increment(key);
        
        // 첫 요청이면 만료 시간 설정
        if (count != null && count == 1) {
            redisTemplate.expire(key, Duration.ofSeconds(TIME_WINDOW_SECONDS));
        }
        
        if (count != null && count > MAX_REQUESTS_PER_MINUTE) {
            log.warn("Rate limit exceeded for IP: {} action: {}", ip, action);
            return false;
        }
        
        return true;
    }
}
