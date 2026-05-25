package com.ourband.api.domain.repository;

import com.ourband.api.domain.model.FavoriteMusic;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface FavoriteMusicRepository extends JpaRepository<FavoriteMusic, Long> {
    
    // 특정 유저의 좋아하는 곡 목록 전체 조회 (프로필 탭 조회용)
    List<FavoriteMusic> findByUserId(Long userId);

    // 특정 유저의 곡을 삭제할 때 유저 검증용으로 사용 가능
    void deleteByIdAndUserId(Long id, Long userId);
}