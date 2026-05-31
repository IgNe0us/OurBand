package com.ourband.api.domain.service;

import com.ourband.api.domain.model.Follow;
import com.ourband.api.domain.repository.FollowRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;
import java.util.Set;

@Service
@RequiredArgsConstructor
@Slf4j
public class UserFollowScheduler {

    private final StringRedisTemplate stringRedisTemplate;
    private final FollowRepository followRepository;

    @Scheduled(fixedRate = 60000) // 1분에 한 번씩 실행
    @Transactional
    public void syncFollowsToDB() {
        Set<String> queue = stringRedisTemplate.opsForSet().members("follow_sync_queue");
        if (queue == null || queue.isEmpty()) return;

        log.info("Redis -> DB 팔로우 동기화 시작 (총 {}건)", queue.size());

        for (String key : queue) {
            try {
                String[] parts = key.split(":");
                Long follower = Long.parseLong(parts[0]);
                Long following = Long.parseLong(parts[1]);
                
                String status = (String) stringRedisTemplate.opsForHash().get("follow_status_map", key);
                
                if (status != null) {
                    Optional<Follow> existing = followRepository.findByFollowerIdAndFollowingId(follower, following);
                    
                    if ("1".equals(status) && existing.isEmpty()) {
                        followRepository.save(Follow.builder().followerId(follower).followingId(following).build());
                    } else if ("0".equals(status) && existing.isPresent()) {
                        followRepository.delete(existing.get());
                    }
                }

                // 처리 완료된 건은 큐와 상태 맵에서 제거
                stringRedisTemplate.opsForSet().remove("follow_sync_queue", key);
                stringRedisTemplate.opsForHash().delete("follow_status_map", key);

            } catch (Exception e) {
                log.error("팔로우 동기화 중 오류 발생: {}", key, e);
            }
        }
        
        log.info("Redis -> DB 팔로우 동기화 완료");
    }
}
