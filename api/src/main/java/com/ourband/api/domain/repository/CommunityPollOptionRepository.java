package com.ourband.api.domain.repository;

import com.ourband.api.domain.model.CommunityPollOption;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface CommunityPollOptionRepository extends JpaRepository<CommunityPollOption, Long> {
    List<CommunityPollOption> findByPollId(Long pollId);
    void deleteByPollId(Long pollId);
}
