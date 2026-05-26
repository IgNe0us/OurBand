package com.ourband.api.domain.repository;

import com.ourband.api.domain.model.CommunityPostLike;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface CommunityPostLikeRepository extends JpaRepository<CommunityPostLike, Long> {
    Optional<CommunityPostLike> findByPostIdAndUserId(Long postId, Long userId);
    boolean existsByPostIdAndUserId(Long postId, Long userId);
    void deleteByPostId(Long postId);
}
