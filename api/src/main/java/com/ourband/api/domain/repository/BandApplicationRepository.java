package com.ourband.api.domain.repository;

import com.ourband.api.domain.model.BandApplication;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface BandApplicationRepository extends JpaRepository<BandApplication, Long> {
    
    List<BandApplication> findByApplicantUserIdOrderByCreatedAtDesc(Long applicantUserId);
    
    List<BandApplication> findByBandIdOrderByCreatedAtDesc(Long bandId);
    
    boolean existsByApplicantUserIdAndBandMemberIdAndStatus(Long applicantUserId, Long bandMemberId, String status);
}
