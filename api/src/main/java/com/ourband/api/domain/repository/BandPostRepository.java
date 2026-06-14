package com.ourband.api.domain.repository;

import com.ourband.api.domain.model.BandPost;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface BandPostRepository extends JpaRepository<BandPost, Long> {
    List<BandPost> findByBandIdAndBoardTypeAndIsHiddenFalseOrderByCreatedAtDesc(Long bandId, String boardType);
    List<BandPost> findByBandIdAndBoardTypeInAndIsHiddenFalseOrderByCreatedAtDesc(Long bandId, List<String> boardTypes);
    List<BandPost> findByBandIdAndIsHiddenFalseOrderByCreatedAtDesc(Long bandId);
    BandPost findFirstByBandIdAndMediaTypeAndIsHiddenFalseOrderByCreatedAtDesc(Long bandId, String mediaType);
    List<BandPost> findByIsHiddenFalseAndCreatedAtAfter(java.time.LocalDateTime since);
    List<BandPost> findByIsHiddenFalse();
}
