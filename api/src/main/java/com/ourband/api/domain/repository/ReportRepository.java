package com.ourband.api.domain.repository;

import com.ourband.api.domain.model.Report;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ReportRepository extends JpaRepository<Report, Long> {

    int countByStatus(String status);
}
