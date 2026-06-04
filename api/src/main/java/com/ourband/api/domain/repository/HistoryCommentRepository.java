package com.ourband.api.domain.repository;

import com.ourband.api.domain.model.HistoryComment;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface HistoryCommentRepository extends JpaRepository<HistoryComment, Long> {
    // 💡 특정 히스토리의 댓글들을 시간순(오래된 순) 또는 최신순으로 가져오기
    List<HistoryComment> findByHistoryIdOrderByCreatedAtDesc(Long historyId);
    
    // 계층형 댓글 조회용
    List<HistoryComment> findByHistoryIdAndParentIdIsNullOrderByCreatedAtAsc(Long historyId);
    List<HistoryComment> findByHistoryIdOrderByCreatedAtAsc(Long historyId);
    List<HistoryComment> findByParentIdOrderByCreatedAtAsc(Long parentId);
}