package com.ourband.api.domain.repository;

import com.ourband.api.domain.model.BandPolls;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface BandPollRepository extends JpaRepository<BandPolls, Long> {
    Optional<BandPolls> findByPostId(Long postId);
    void deleteByPostId(Long postId);
}
