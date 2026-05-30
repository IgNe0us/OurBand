package com.ourband.api.domain.repository;

import com.ourband.api.domain.model.StudioImage;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface StudioImageRepository extends JpaRepository<StudioImage, Long> {
    List<StudioImage> findByStudioId(Long studioId);
}
