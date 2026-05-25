package com.ourband.api.domain.repository;

import com.ourband.api.domain.model.Follow;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface FollowRepository extends JpaRepository<Follow, Long> {
    
    // 1. 나를 팔로우 하는 사람 수 (팔로워 수)
    int countByFollowingId(Long followingId);
    
    // 2. 내가 팔로우 하는 사람 수 (팔로잉 수)
    int countByFollowerId(Long followerId);
    
    // 3. 이미 팔로우 상태인지 확인용 (중복 팔로우 방지나 하트 색칠할 때 사용)
    Optional<Follow> findByFollowerIdAndFollowingId(Long followerId, Long followingId);
    
    // 4. 언팔로우 할 때 사용 (나와 상대방 ID로 팔로우 기록 삭제)
    void deleteByFollowerIdAndFollowingId(Long followerId, Long followingId);

    // 5. 나를 팔로우하는 사람 목록 (팔로워 리스트)
    List<Follow> findByFollowingId(Long followingId);

    // 6. 내가 팔로우하는 사람 목록 (팔로잉 리스트)
    List<Follow> findByFollowerId(Long followerId);
}