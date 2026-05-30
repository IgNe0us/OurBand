package com.ourband.api.domain.repository;

import com.ourband.api.domain.model.JamPostLike;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface JamPostLikeRepository extends JpaRepository<JamPostLike, Long> {
    Optional<JamPostLike> findByJamIdAndUserId(Long jamId, Long userId);
    boolean existsByJamIdAndUserId(Long jamId, Long userId);
}
