package com.ourband.api.domain.repository;

import com.ourband.api.domain.model.Bands;
import org.springframework.data.jpa.repository.JpaRepository;

public interface BandRepository extends JpaRepository<Bands, Long> {
}
