package com.ourband.api.domain.repository;

import com.ourband.api.domain.model.PositionCategory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface PositionCategoryRepository extends JpaRepository<PositionCategory, Long> {
    Optional<PositionCategory> findByPositionName(String positionName);
    boolean existsByPositionName(String positionName);
}
