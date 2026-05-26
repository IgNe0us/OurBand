package com.ourband.api.domain.repository;

import com.ourband.api.domain.model.CommunityPostComment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface CommunityPostCommentRepository extends JpaRepository<CommunityPostComment, Long> {
    List<CommunityPostComment> findByPostId(Long postId);
}
