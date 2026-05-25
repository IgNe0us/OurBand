package com.ourband.api.domain.repository;

import com.ourband.api.domain.model.BandPollOptions;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface BandPollOptionRepository extends JpaRepository<BandPollOptions, Long> {
    List<BandPollOptions> findByPollIdOrderBySortOrderAsc(Long pollId);
    List<BandPollOptions> findByPollId(Long pollId);
    void deleteByPollId(Long pollId);
}
