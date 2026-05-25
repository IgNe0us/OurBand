package com.ourband.api.domain.repository;

import com.ourband.api.domain.model.Profile;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface ProfileRepository extends JpaRepository<Profile, Long> {
    // User 엔티티의 id로 Profile을 찾는 쿼리 메서드
    Optional<Profile> findByUser_UserId(Long userId);
}