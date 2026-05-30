package com.ourband.api.domain.service;

import com.ourband.api.domain.dto.studio.*;
import com.ourband.api.domain.model.Studio;
import com.ourband.api.domain.model.StudioImage;
import com.ourband.api.domain.model.StudioRoom;
import com.ourband.api.domain.repository.ReportRepository;
import com.ourband.api.domain.model.Report;
import com.ourband.api.domain.repository.StudioImageRepository;
import com.ourband.api.domain.repository.StudioRepository;
import com.ourband.api.domain.repository.StudioRoomRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class StudioService {
    private final StudioRepository studioRepository;
    private final StudioImageRepository studioImageRepository;
    private final StudioRoomRepository studioRoomRepository;
    private final ReportRepository reportRepository;

    @Transactional(readOnly = true)
    public List<StudioListResponseDTO> getStudiosWithinRadius(double lat, double lng, double radiusKm) {
        double latChange = radiusKm / 111.0;
        double lngChange = radiusKm / (111.0 * Math.cos(Math.toRadians(lat)));

        List<Studio> studios = studioRepository.findByLatBetweenAndLngBetween(
                lat - latChange, lat + latChange,
                lng - lngChange, lng + lngChange
        );

        return studios.stream()
                .map(studio -> {
                    double distKm = calculateHaversineDistance(lat, lng, studio.getLat(), studio.getLng());
                    return StudioListResponseDTO.builder()
                            .id(studio.getId())
                            .name(studio.getName())
                            .address(studio.getAddress())
                            .lat(studio.getLat())
                            .lng(studio.getLng())
                            .amenities(studio.getAmenities())
                            .rating(studio.getRating())
                            .reviewCount(studio.getReviewCount())
                            .distKm(distKm)
                            .build();
                })
                .filter(dto -> dto.getDistKm() <= radiusKm)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public StudioResponseDTO getStudioById(Long id) {
        Studio studio = studioRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Studio not found"));

        List<StudioRoomDTO> rooms = studioRoomRepository.findByStudioId(id).stream()
                .map(r -> StudioRoomDTO.builder()
                        .id(r.getId())
                        .name(r.getName())
                        .size(r.getSize())
                        .equipment(r.getEquipment())
                        .build())
                .collect(Collectors.toList());

        List<StudioImageDTO> images = studioImageRepository.findByStudioId(id).stream()
                .map(i -> StudioImageDTO.builder()
                        .id(i.getId())
                        .imageUrl(i.getImageUrl())
                        .build())
                .collect(Collectors.toList());

        return StudioResponseDTO.builder()
                .id(studio.getId())
                .ownerId(studio.getOwnerId())
                .name(studio.getName())
                .address(studio.getAddress())
                .lat(studio.getLat())
                .lng(studio.getLng())
                .description(studio.getDescription())
                .amenities(studio.getAmenities())
                .bookingUrl(studio.getBookingUrl())
                .rating(studio.getRating())
                .reviewCount(studio.getReviewCount())
                .rooms(rooms)
                .images(images)
                .build();
    }

    @Transactional
    public StudioResponseDTO createStudio(Long ownerId, StudioCreateRequestDTO request) {
        Studio studio = Studio.builder()
                .ownerId(ownerId)
                .name(request.getName())
                .address(request.getAddress())
                .lat(request.getLat())
                .lng(request.getLng())
                .description(request.getDescription())
                .amenities(request.getAmenities())
                .bookingUrl(request.getBookingUrl())
                .rating(0.0)
                .reviewCount(0)
                .build();

        Studio savedStudio = studioRepository.save(studio);

        if (request.getRooms() != null) {
            for (StudioRoomDTO r : request.getRooms()) {
                StudioRoom room = StudioRoom.builder()
                        .studio(savedStudio)
                        .name(r.getName())
                        .size(r.getSize())
                        .equipment(r.getEquipment())
                        .build();
                studioRoomRepository.save(room);
            }
        }

        if (request.getImageUrls() != null) {
            for (String url : request.getImageUrls()) {
                StudioImage img = StudioImage.builder()
                        .studio(savedStudio)
                        .imageUrl(url)
                        .build();
                studioImageRepository.save(img);
            }
        }

        return getStudioById(savedStudio.getId());
    }

    @Transactional
    public StudioResponseDTO updateStudio(Long studioId, Long ownerId, StudioCreateRequestDTO request) {
        Studio studio = studioRepository.findById(studioId)
                .orElseThrow(() -> new RuntimeException("Studio not found"));

        if (!studio.getOwnerId().equals(ownerId)) {
            throw new RuntimeException("권한이 없습니다.");
        }

        studio.setName(request.getName());
        studio.setAddress(request.getAddress());
        studio.setLat(request.getLat());
        studio.setLng(request.getLng());
        studio.setDescription(request.getDescription());
        studio.setAmenities(request.getAmenities());
        studio.setBookingUrl(request.getBookingUrl());

        // Update Rooms (Delete all and insert)
        studioRoomRepository.deleteAll(studioRoomRepository.findByStudioId(studioId));
        if (request.getRooms() != null) {
            for (StudioRoomDTO r : request.getRooms()) {
                StudioRoom room = StudioRoom.builder()
                        .studio(studio)
                        .name(r.getName())
                        .size(r.getSize())
                        .equipment(r.getEquipment())
                        .build();
                studioRoomRepository.save(room);
            }
        }

        // Update Images (Delete all and insert)
        studioImageRepository.deleteAll(studioImageRepository.findByStudioId(studioId));
        if (request.getImageUrls() != null) {
            for (String url : request.getImageUrls()) {
                StudioImage img = StudioImage.builder()
                        .studio(studio)
                        .imageUrl(url)
                        .build();
                studioImageRepository.save(img);
            }
        }

        return getStudioById(studioId);
    }

    @Transactional
    public void deleteStudio(Long studioId, Long ownerId) {
        Studio studio = studioRepository.findById(studioId)
                .orElseThrow(() -> new RuntimeException("Studio not found"));

        if (!studio.getOwnerId().equals(ownerId)) {
            throw new RuntimeException("권한이 없습니다.");
        }

        studioRoomRepository.deleteAll(studioRoomRepository.findByStudioId(studioId));
        studioImageRepository.deleteAll(studioImageRepository.findByStudioId(studioId));
        studioRepository.delete(studio);
    }

    @Transactional
    public void reportStudio(Long studioId, Long reporterId, String reason) {
        // Validate existence
        studioRepository.findById(studioId)
                .orElseThrow(() -> new RuntimeException("Studio not found"));

        Report report = Report.builder()
                .reporterId(reporterId)
                .targetType("STUDIO")
                .targetId(studioId)
                .reason(reason)
                .status("PENDING")
                .build();
        reportRepository.save(report);
    }

    private double calculateHaversineDistance(double lat1, double lon1, double lat2, double lon2) {
        final int R = 6371; // Radius of the earth in km
        double dLat = Math.toRadians(lat2 - lat1);
        double dLon = Math.toRadians(lon2 - lon1);
        double a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2)) *
                        Math.sin(dLon / 2) * Math.sin(dLon / 2);
        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }
}
