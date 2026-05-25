package com.ourband.api.domain.repository;

import com.ourband.api.domain.model.UserHistory;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface UserHistoryRepository extends JpaRepository<UserHistory, Long> {
    // 특정 유저가 작성한 히스토리 목록을 최신순(내림차순)으로 조회
    List<UserHistory> findByUserIdOrderByCreatedAtDesc(Long userId);
}