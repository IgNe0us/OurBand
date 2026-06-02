package com.ourband.api.domain.repository;

import com.ourband.api.domain.model.HistoryLike;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface HistoryLikeRepository extends JpaRepository<HistoryLike, Long> {
    // 💡 특정 유저가 이 글에 좋아요를 이미 눌렀는지 찾기 위한 메서드
    Optional<HistoryLike> findByHistoryIdAndUserId(Long historyId, Long userId);
    
    // 유저가 좋아요 누른 모든 히스토리 조회 (트렌드 조회용)
    java.util.List<HistoryLike> findByUserId(Long userId);
}