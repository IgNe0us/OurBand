package com.ourband.api.domain.repository;

import com.ourband.api.domain.model.StudioRoom;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface StudioRoomRepository extends JpaRepository<StudioRoom, Long> {
    List<StudioRoom> findByStudioId(Long studioId);
}
