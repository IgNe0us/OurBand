package com.ourband.api.domain.repository;

import com.ourband.api.domain.model.UserGear;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface UserGearRepository extends JpaRepository<UserGear, Long> {
    // 특정 유저의 장비 목록 전체 조회
    List<UserGear> findByUserId(Long userId);

    // 특정 유저의 장비를 삭제할 때 유저 검증용으로 사용 가능
    void deleteByIdAndUserId(Long id, Long userId);
}