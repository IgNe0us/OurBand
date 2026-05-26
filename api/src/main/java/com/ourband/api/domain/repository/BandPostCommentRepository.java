package com.ourband.api.domain.repository;

import com.ourband.api.domain.model.BandPostComment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface BandPostCommentRepository extends JpaRepository<BandPostComment, Long> {
    List<BandPostComment> findByPostIdOrderByCreatedAtAsc(Long postId);
    List<BandPostComment> findByPostIdAndParentIdIsNullOrderByCreatedAtAsc(Long postId);
    List<BandPostComment> findByParentIdOrderByCreatedAtAsc(Long parentId);
    void deleteAllByPostId(Long postId);
}
