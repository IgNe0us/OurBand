package com.ourband.api.domain.repository;

import com.ourband.api.domain.model.BandPollVotes;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface BandPollVoteRepository extends JpaRepository<BandPollVotes, Long> {
    List<BandPollVotes> findByPollOptionId(Long pollOptionId);
    List<BandPollVotes> findByPollOptionIdIn(List<Long> pollOptionIds);
    Optional<BandPollVotes> findByPollOptionIdAndUserId(Long pollOptionId, Long userId);
    List<BandPollVotes> findByPollOptionIdInAndUserId(List<Long> pollOptionIds, Long userId);
    void deleteByPollOptionIdIn(List<Long> pollOptionIds);
}
