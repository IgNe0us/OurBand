package com.ourband.api.domain.repository;

import com.ourband.api.domain.model.RecruitmentOffer;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface RecruitmentOfferRepository extends JpaRepository<RecruitmentOffer, Long> {
    
    List<RecruitmentOffer> findByTargetUserIdOrderByCreatedAtDesc(Long targetUserId);
    
    List<RecruitmentOffer> findBySenderUserIdOrderByCreatedAtDesc(Long senderUserId);
    
    boolean existsByTargetUserIdAndSeekingPostIdAndStatus(Long targetUserId, Long seekingPostId, String status);
}
