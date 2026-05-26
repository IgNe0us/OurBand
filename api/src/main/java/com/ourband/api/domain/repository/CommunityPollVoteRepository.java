package com.ourband.api.domain.repository;

import com.ourband.api.domain.model.CommunityPollVote;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface CommunityPollVoteRepository extends JpaRepository<CommunityPollVote, Long> {
    List<CommunityPollVote> findByPollOptionIdIn(List<Long> pollOptionIds);
    Optional<CommunityPollVote> findByPollOptionIdInAndUserId(List<Long> pollOptionIds, Long userId);
}
