package com.ourband.api.domain.repository;

import com.ourband.api.domain.model.Studio;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface StudioRepository extends JpaRepository<Studio, Long> {
    List<Studio> findByLatBetweenAndLngBetween(double minLat, double maxLat, double minLng, double maxLng);
}
