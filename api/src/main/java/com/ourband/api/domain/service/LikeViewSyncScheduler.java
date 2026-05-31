package com.ourband.api.domain.service;

import com.ourband.api.domain.model.*;
import com.ourband.api.domain.repository.*;
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
public class LikeViewSyncScheduler {

    private final StringRedisTemplate stringRedisTemplate;
    
    private final CommunityPostRepository communityPostRepository;
    private final CommunityPostLikeRepository communityPostLikeRepository;
    
    private final BandPostRepository bandPostRepository;
    private final com.ourband.api.domain.repository.BandPostLikeRepository bandPostLikeRepository;
    
    private final UserHistoryRepository userHistoryRepository;
    private final HistoryLikeRepository historyLikeRepository;

    @Scheduled(fixedRate = 60000) // 1분 단위
    @Transactional
    public void syncLikesAndViewsToDB() {
        syncDomainLikesAndViews("community");
        syncDomainLikesAndViews("band");
        syncDomainLikesAndViews("history");
    }

    private void syncDomainLikesAndViews(String domain) {
        syncLikes(domain);
        syncViews(domain);
    }

    private void syncLikes(String domain) {
        String syncQueueKey = "like_sync_queue:" + domain;
        String actionHashKey = "like_actions:" + domain;
        String countHashKey = "like_counts:" + domain;

        Set<String> fieldKeys = stringRedisTemplate.opsForSet().members(syncQueueKey);
        if (fieldKeys == null || fieldKeys.isEmpty()) return;

        for (String fieldKey : fieldKeys) {
            try {
                String[] parts = fieldKey.split(":");
                Long targetId = Long.parseLong(parts[0]);
                Long userId = Long.parseLong(parts[1]);

                // 1. 관계 테이블(Like) 갱신
                String status = (String) stringRedisTemplate.opsForHash().get(actionHashKey, fieldKey);
                if (status != null) {
                    updateLikeRelationship(domain, targetId, userId, "1".equals(status));
                    stringRedisTemplate.opsForHash().delete(actionHashKey, fieldKey);
                }

                // 2. 카운트 갱신 (한 게시글에 여러 명이 눌렀어도 한 번만 카운트 갱신되도록)
                String countIncStr = (String) stringRedisTemplate.opsForHash().get(countHashKey, targetId.toString());
                if (countIncStr != null) {
                    int increment = Integer.parseInt(countIncStr);
                    if (increment != 0) {
                        updateLikeCountInDB(domain, targetId, increment);
                    }
                    stringRedisTemplate.opsForHash().delete(countHashKey, targetId.toString());
                }

                // 큐에서 제거
                stringRedisTemplate.opsForSet().remove(syncQueueKey, fieldKey);
            } catch (Exception e) {
                log.error("좋아요 동기화 중 오류 (domain: {}, key: {})", domain, fieldKey, e);
            }
        }
    }

    private void syncViews(String domain) {
        String syncQueueKey = "view_sync_queue:" + domain;
        String countHashKey = "view_counts:" + domain;

        Set<String> targetIds = stringRedisTemplate.opsForSet().members(syncQueueKey);
        if (targetIds == null || targetIds.isEmpty()) return;

        for (String targetIdStr : targetIds) {
            try {
                Long targetId = Long.parseLong(targetIdStr);
                
                String countIncStr = (String) stringRedisTemplate.opsForHash().get(countHashKey, targetIdStr);
                if (countIncStr != null) {
                    int increment = Integer.parseInt(countIncStr);
                    if (increment > 0) {
                        updateViewCountInDB(domain, targetId, increment);
                    }
                    stringRedisTemplate.opsForHash().delete(countHashKey, targetIdStr);
                }

                stringRedisTemplate.opsForSet().remove(syncQueueKey, targetIdStr);
            } catch (Exception e) {
                log.error("조회수 동기화 중 오류 (domain: {}, key: {})", domain, targetIdStr, e);
            }
        }
    }

    private void updateLikeRelationship(String domain, Long targetId, Long userId, boolean isLiked) {
        if ("community".equals(domain)) {
            boolean exists = communityPostLikeRepository.existsByPostIdAndUserId(targetId, userId);
            if (isLiked && !exists) {
                communityPostLikeRepository.save(CommunityPostLike.builder().postId(targetId).userId(userId).build());
            } else if (!isLiked && exists) {
                communityPostLikeRepository.findByPostIdAndUserId(targetId, userId).ifPresent(communityPostLikeRepository::delete);
            }
        } else if ("band".equals(domain)) {
            boolean exists = bandPostLikeRepository.existsByPostIdAndUserId(targetId, userId);
            if (isLiked && !exists) {
                bandPostLikeRepository.save(com.ourband.api.domain.model.BandPostLike.builder().postId(targetId).userId(userId).build());
            } else if (!isLiked && exists) {
                bandPostLikeRepository.deleteByPostIdAndUserId(targetId, userId);
            }
        } else if ("history".equals(domain)) {
            boolean exists = historyLikeRepository.findByHistoryIdAndUserId(targetId, userId).isPresent();
            if (isLiked && !exists) {
                historyLikeRepository.save(HistoryLike.builder().historyId(targetId).userId(userId).build());
            } else if (!isLiked && exists) {
                historyLikeRepository.findByHistoryIdAndUserId(targetId, userId).ifPresent(historyLikeRepository::delete);
            }
        }
    }

    private void updateLikeCountInDB(String domain, Long targetId, int increment) {
        if ("community".equals(domain)) {
            communityPostRepository.findById(targetId).ifPresent(post -> {
                post.setLikeCount(Math.max(0, post.getLikeCount() + increment));
                communityPostRepository.save(post);
            });
        } else if ("band".equals(domain)) {
            bandPostRepository.findById(targetId).ifPresent(post -> {
                post.setLikeCount(Math.max(0, post.getLikeCount() + increment));
                bandPostRepository.save(post);
            });
        } else if ("history".equals(domain)) {
            userHistoryRepository.findById(targetId).ifPresent(history -> {
                if (increment > 0) {
                    for (int i = 0; i < increment; i++) history.increaseLikeCount();
                } else {
                    for (int i = 0; i < Math.abs(increment); i++) history.decreaseLikeCount();
                }
                userHistoryRepository.save(history);
            });
        }
    }

    private void updateViewCountInDB(String domain, Long targetId, int increment) {
        if ("community".equals(domain)) {
            communityPostRepository.findById(targetId).ifPresent(post -> {
                post.setViewCount(post.getViewCount() + increment);
                communityPostRepository.save(post);
            });
        } else if ("band".equals(domain)) {
            // 밴드 게시글은 조회수가 없음
        } else if ("history".equals(domain)) {
            userHistoryRepository.findById(targetId).ifPresent(history -> {
                for (int i = 0; i < increment; i++) history.increaseViewCount();
                userHistoryRepository.save(history);
            });
        }
    }
}
