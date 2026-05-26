package com.ourband.api.domain.repository;

import com.ourband.api.domain.model.CommunityPoll;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface CommunityPollRepository extends JpaRepository<CommunityPoll, Long> {
    Optional<CommunityPoll> findByPostId(Long postId);
    void deleteByPostId(Long postId);
}
