package com.ourband.api.domain.controller;

import com.ourband.api.global.security.JwtUtil;
import com.ourband.api.domain.dto.recruitment.MemberSeekingPostCreateRequestDTO;
import com.ourband.api.domain.dto.recruitment.RecruitmentOfferRequestDTO;
import com.ourband.api.domain.service.RecruitmentService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/recruitments")
@RequiredArgsConstructor
public class RecruitmentController {

    private final RecruitmentService recruitmentService;
    private final JwtUtil jwtUtil;

    @GetMapping("/seekings")
    public ResponseEntity<?> getSeekingPosts() {
        return ResponseEntity.ok(recruitmentService.getSeekingPosts());
    }

    @GetMapping("/seekings/{id}")
    public ResponseEntity<?> getSeekingPost(@PathVariable("id") Long id) {
        try {
            return ResponseEntity.ok(recruitmentService.getSeekingPost(id));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", e.getMessage()));
        }
    }

    @PostMapping("/seekings")
    public ResponseEntity<?> createSeekingPost(@CookieValue(value = "access_token") String accessToken,
                                               @RequestBody MemberSeekingPostCreateRequestDTO request) {
        try {
            Long userId = jwtUtil.getUserId(accessToken);
            return ResponseEntity.ok(recruitmentService.createSeekingPost(userId, request));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("message", e.getMessage()));
        }
    }

    @PutMapping("/seekings/{id}")
    public ResponseEntity<?> updateSeekingPost(@PathVariable("id") Long id,
                                               @CookieValue(value = "access_token") String accessToken,
                                               @RequestBody MemberSeekingPostCreateRequestDTO request) {
        try {
            Long userId = jwtUtil.getUserId(accessToken);
            return ResponseEntity.ok(recruitmentService.updateSeekingPost(id, userId, request));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("message", e.getMessage()));
        }
    }

    @DeleteMapping("/seekings/{id}")
    public ResponseEntity<?> deleteSeekingPost(@PathVariable("id") Long id,
                                               @CookieValue(value = "access_token") String accessToken) {
        try {
            Long userId = jwtUtil.getUserId(accessToken);
            recruitmentService.deleteSeekingPost(id, userId);
            return ResponseEntity.ok(Map.of("message", "삭제되었습니다."));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("message", e.getMessage()));
        }
    }

    @PostMapping("/offers")
    public ResponseEntity<?> sendOffer(@CookieValue(value = "access_token") String accessToken,
                                       @RequestBody RecruitmentOfferRequestDTO request) {
        try {
            Long userId = jwtUtil.getUserId(accessToken);
            return ResponseEntity.ok(recruitmentService.sendOffer(userId, request));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("message", e.getMessage()));
        }
    }

    @GetMapping("/offers/received")
    public ResponseEntity<?> getReceivedOffers(@CookieValue(value = "access_token") String accessToken) {
        try {
            Long userId = jwtUtil.getUserId(accessToken);
            return ResponseEntity.ok(recruitmentService.getReceivedOffers(userId));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("message", e.getMessage()));
        }
    }

    @PatchMapping("/offers/{id}/accept")
    public ResponseEntity<?> acceptOffer(@PathVariable("id") Long id,
                                         @CookieValue(value = "access_token") String accessToken) {
        try {
            Long userId = jwtUtil.getUserId(accessToken);
            recruitmentService.acceptOffer(id, userId);
            return ResponseEntity.ok(Map.of("message", "수락되었습니다."));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("message", e.getMessage()));
        }
    }

    @PatchMapping("/offers/{id}/reject")
    public ResponseEntity<?> rejectOffer(@PathVariable("id") Long id,
                                         @CookieValue(value = "access_token") String accessToken) {
        try {
            Long userId = jwtUtil.getUserId(accessToken);
            recruitmentService.rejectOffer(id, userId);
            return ResponseEntity.ok(Map.of("message", "거절되었습니다."));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("message", e.getMessage()));
        }
    }
}
