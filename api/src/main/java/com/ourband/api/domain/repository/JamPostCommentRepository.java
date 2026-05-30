package com.ourband.api.domain.repository;

import com.ourband.api.domain.model.JamPostComment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface JamPostCommentRepository extends JpaRepository<JamPostComment, Long> {
    List<JamPostComment> findByJamIdAndParentIdIsNullOrderByCreatedAtAsc(Long jamId);
    List<JamPostComment> findByParentIdOrderByCreatedAtAsc(Long parentId);
}
