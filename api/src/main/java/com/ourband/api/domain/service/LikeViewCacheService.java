package com.ourband.api.domain.service;

import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.time.Duration;

@Service
@RequiredArgsConstructor
public class LikeViewCacheService {

    private final StringRedisTemplate stringRedisTemplate;

    // ==========================================
    // 좋아요 처리 (Like)
    // ==========================================
    
    /**
     * 좋아요 상태 토글 및 카운트 증감 (Write-Behind 캐시)
     */
    public boolean toggleLike(String domain, Long targetId, Long userId, boolean currentDbStatus) {
        String hashKey = "like_actions:" + domain;
        String countKey = "like_counts:" + domain;
        String fieldKey = targetId + ":" + userId;

        String cachedAction = (String) stringRedisTemplate.opsForHash().get(hashKey, fieldKey);
        
        boolean isCurrentlyLiked = cachedAction != null ? "1".equals(cachedAction) : currentDbStatus;
        boolean newStatus = !isCurrentlyLiked;
        
        // 상태 저장 (나중에 스케줄러가 읽어감)
        stringRedisTemplate.opsForHash().put(hashKey, fieldKey, newStatus ? "1" : "0");
        
        // 카운트 증감
        stringRedisTemplate.opsForHash().increment(countKey, targetId.toString(), newStatus ? 1 : -1);
        
        // 동기화 큐에 추가
        stringRedisTemplate.opsForSet().add("like_sync_queue:" + domain, fieldKey);

        return newStatus;
    }

    /**
     * 현재 사용자가 좋아요를 눌렀는지 확인
     */
    public boolean isLiked(String domain, Long targetId, Long userId, boolean dbStatus) {
        if (userId == null) return false;
        String hashKey = "like_actions:" + domain;
        String fieldKey = targetId + ":" + userId;
        String cachedAction = (String) stringRedisTemplate.opsForHash().get(hashKey, fieldKey);
        if (cachedAction != null) {
            return "1".equals(cachedAction);
        }
        return dbStatus;
    }

    /**
     * 캐시된 카운트를 포함한 실제 좋아요 수 계산
     */
    public int getCachedLikeCount(String domain, Long targetId, int dbCount) {
        String countKey = "like_counts:" + domain;
        String incStr = (String) stringRedisTemplate.opsForHash().get(countKey, targetId.toString());
        if (incStr != null) {
            return dbCount + Integer.parseInt(incStr);
        }
        return dbCount;
    }

    // ==========================================
    // 조회수 처리 (View) - 어뷰징 방지 포함
    // ==========================================

    /**
     * 조회수 증가 (1일 1회 제한)
     */
    public void incrementViewCount(String domain, Long targetId, Long userId) {
        // userId가 없는 비회원은 IP 기반으로 해야 하지만, 여기서는 임시로 -1 (또는 세션ID) 사용 고려
        // 요구사항에 맞춰 userId 기준 1일 1회 제한
        String userKey = userId != null ? userId.toString() : "anonymous";
        
        // 어뷰징 방지 키 (하루에 한 번만 증가 가능)
        String abuseKey = "view_abuse:" + domain + ":" + targetId + ":" + userKey;
        
        Boolean isFirstView = stringRedisTemplate.opsForValue().setIfAbsent(abuseKey, "1", Duration.ofDays(1));
        
        if (Boolean.TRUE.equals(isFirstView)) {
            String countKey = "view_counts:" + domain;
            stringRedisTemplate.opsForHash().increment(countKey, targetId.toString(), 1);
            stringRedisTemplate.opsForSet().add("view_sync_queue:" + domain, targetId.toString());
        }
    }
    
    /**
     * 캐시된 카운트를 포함한 실제 조회수 계산
     */
    public int getCachedViewCount(String domain, Long targetId, int dbCount) {
        String countKey = "view_counts:" + domain;
        String incStr = (String) stringRedisTemplate.opsForHash().get(countKey, targetId.toString());
        if (incStr != null) {
            return dbCount + Integer.parseInt(incStr);
        }
        return dbCount;
    }
}
