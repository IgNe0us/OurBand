package com.ourband.api.domain.repository;

import com.ourband.api.domain.model.BandPostLike;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface BandPostLikeRepository extends JpaRepository<BandPostLike, Long> {
    Optional<BandPostLike> findByPostIdAndUserId(Long postId, Long userId);
    boolean existsByPostIdAndUserId(Long postId, Long userId);
    void deleteByPostIdAndUserId(Long postId, Long userId);
    void deleteAllByPostId(Long postId);
}
