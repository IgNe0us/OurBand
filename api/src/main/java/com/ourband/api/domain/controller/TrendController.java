package com.ourband.api.domain.controller;

import com.ourband.api.domain.dto.jam.JamPostResponseDTO;
import com.ourband.api.domain.dto.user.BandListResponseDTO;
import com.ourband.api.domain.repository.BandFollowRepository;
import com.ourband.api.domain.repository.JamPostLikeRepository;
import com.ourband.api.domain.service.TrendService;
import com.ourband.api.global.security.JwtUtil;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CookieValue;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/v1/trends")
@RequiredArgsConstructor
public class TrendController {

    private final TrendService trendService;
    private final BandFollowRepository bandFollowRepository;
    private final JamPostLikeRepository jamPostLikeRepository;
    private final JwtUtil jwtUtil;
    private final ObjectMapper objectMapper;

    @GetMapping("/bands")
    public ResponseEntity<List<BandListResponseDTO>> getTrendingBands(
            @CookieValue(value = "access_token", required = false) String accessToken) {
        List<?> rawBands = trendService.getTrendingBands();

        List<BandListResponseDTO> bands = objectMapper.convertValue(
                rawBands, new TypeReference<List<BandListResponseDTO>>() {});

        if (accessToken != null && !accessToken.isEmpty()) {
            try {
                Long currentUserId = jwtUtil.getUserId(accessToken);
                Set<Long> followedBandIds = bandFollowRepository.findByUserId(currentUserId).stream()
                        .map(f -> f.getBandId())
                        .collect(Collectors.toSet());

                bands.forEach(band -> band.setFollowed(followedBandIds.contains(band.getId())));
            } catch (Exception ignored) {
            }
        }

        return ResponseEntity.ok(bands);
    }

    @GetMapping("/jams")
    public ResponseEntity<List<JamPostResponseDTO>> getTrendingJams(
            @CookieValue(value = "access_token", required = false) String accessToken) {
        List<?> rawJams = trendService.getTrendingJams();
        
        List<JamPostResponseDTO> jams = objectMapper.convertValue(
                rawJams, new TypeReference<List<JamPostResponseDTO>>() {});

        if (accessToken != null && !accessToken.isEmpty()) {
            try {
                Long currentUserId = jwtUtil.getUserId(accessToken);
                Set<Long> likedJamIds = jamPostLikeRepository.findByUserId(currentUserId).stream()
                        .map(f -> f.getJamId())
                        .collect(Collectors.toSet());

                jams.forEach(jam -> jam.setLiked(likedJamIds.contains(jam.getId())));
            } catch (Exception ignored) {
            }
        }

        return ResponseEntity.ok(jams);
    }
}
