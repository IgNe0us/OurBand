package com.ourband.api.domain.repository;

import com.ourband.api.domain.model.MemberSeekingPost;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MemberSeekingPostRepository extends JpaRepository<MemberSeekingPost, Long> {
    
    List<MemberSeekingPost> findByStatusOrderByCreatedAtDesc(String status);
    
    List<MemberSeekingPost> findByUserIdOrderByCreatedAtDesc(Long userId);
    
    // For location & position filters, we can add custom query if needed or use Specification
}
