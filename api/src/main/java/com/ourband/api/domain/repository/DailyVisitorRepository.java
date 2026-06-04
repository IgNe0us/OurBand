package com.ourband.api.domain.repository;

import com.ourband.api.domain.model.DailyVisitor;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface DailyVisitorRepository extends JpaRepository<DailyVisitor, Long> {
    Optional<DailyVisitor> findByVisitDate(LocalDate visitDate);
    List<DailyVisitor> findTop7ByOrderByVisitDateDesc();
}
