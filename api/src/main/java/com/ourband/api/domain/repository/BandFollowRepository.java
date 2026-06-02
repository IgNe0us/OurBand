package com.ourband.api.domain.repository;

import com.ourband.api.domain.model.BandFollow;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;
import java.util.List;

public interface BandFollowRepository extends JpaRepository<BandFollow, Long> {
    Optional<BandFollow> findByUserIdAndBandId(Long userId, Long bandId);
    boolean existsByUserIdAndBandId(Long userId, Long bandId);
    List<BandFollow> findByUserId(Long userId);
    long countByBandId(Long bandId);
    void deleteAllByBandId(Long bandId);
    List<BandFollow> findByCreatedAtAfter(java.time.LocalDateTime since);
}
