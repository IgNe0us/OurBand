package com.ourband.api.domain.repository;

import com.ourband.api.domain.model.Portfolio;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PortfolioRepository extends JpaRepository<Portfolio, Long> {
    Page<Portfolio> findByUser_UserIdOrderByCreatedAtDesc(Long userId, Pageable pageable);
    Page<Portfolio> findByUser_UserIdAndIsPublicTrueOrderByCreatedAtDesc(Long userId, Pageable pageable);
}
