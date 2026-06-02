package com.ourband.api.domain.repository;

import com.ourband.api.domain.model.BandPost;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface BandPostRepository extends JpaRepository<BandPost, Long> {
    List<BandPost> findByBandIdAndBoardTypeOrderByCreatedAtDesc(Long bandId, String boardType);
    List<BandPost> findByBandIdAndBoardTypeInOrderByCreatedAtDesc(Long bandId, List<String> boardTypes);
    List<BandPost> findByBandIdOrderByCreatedAtDesc(Long bandId);
    BandPost findFirstByBandIdAndMediaTypeOrderByCreatedAtDesc(Long bandId, String mediaType);
    List<BandPost> findByCreatedAtAfter(java.time.LocalDateTime since);
}
