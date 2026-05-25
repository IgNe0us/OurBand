package com.ourband.api.domain.controller;

import com.ourband.api.domain.dto.user.*;
import com.ourband.api.domain.service.BandService;
import com.ourband.api.global.security.JwtUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/bands")
@RequiredArgsConstructor
public class BandController {

    private final BandService bandService;
    private final JwtUtil jwtUtil;

    /**
     * 밴드 상세 및 멤버 포지션 조회
     */
    @GetMapping("/{bandId}")
    public ResponseEntity<?> getBandProfile(
            @PathVariable("bandId") Long bandId,
            @CookieValue(value = "access_token", required = false) String accessToken) {
        try {
            Long currentUserId = null;
            if (accessToken != null && !accessToken.isEmpty()) {
                currentUserId = jwtUtil.getUserId(accessToken);
            }
            BandProfileResponseDTO result = bandService.getBandProfile(bandId, currentUserId);
            return ResponseEntity.ok(result);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("message", e.getMessage()));
        }
    }

    /**
     * 밴드 프로필, 포지션 구성, 연혁 업데이트
     */
    @PutMapping("/{bandId}")
    public ResponseEntity<?> updateBandProfile(
            @PathVariable("bandId") Long bandId,
            @CookieValue(value = "access_token") String accessToken,
            @RequestBody BandProfileUpdateRequestDTO request) {
        try {
            Long currentUserId = jwtUtil.getUserId(accessToken);
            BandProfileResponseDTO result = bandService.updateBandProfile(bandId, currentUserId, request);
            return ResponseEntity.ok(result);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("message", e.getMessage()));
        }
    }

    /**
     * 밴드 게시글(카테고리별) 조회
     */
    @GetMapping("/{bandId}/posts")
    public ResponseEntity<?> getBandPosts(
            @PathVariable("bandId") Long bandId,
            @RequestParam(value = "boardType", required = false) String boardType) {
        try {
            List<BandPostResponseDTO> result = bandService.getBandPosts(bandId, boardType);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("message", e.getMessage()));
        }
    }

    /**
     * 단일 게시글 상세 조회
     */
    @GetMapping("/posts/{postId}")
    public ResponseEntity<?> getBandPost(
            @PathVariable("postId") Long postId,
            @CookieValue(value = "access_token", required = false) String accessToken) {
        try {
            Long currentUserId = null;
            if (accessToken != null && !accessToken.isEmpty()) {
                currentUserId = jwtUtil.getUserId(accessToken);
            }
            BandPostResponseDTO result = bandService.getBandPost(postId, currentUserId);
            return ResponseEntity.ok(result);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("message", e.getMessage()));
        }
    }

    /**
     * 밴드 게시글(공지, 자유, 일정, 영상) 생성
     */
    @PostMapping("/{bandId}/posts")
    public ResponseEntity<?> createBandPost(
            @PathVariable("bandId") Long bandId,
            @CookieValue(value = "access_token") String accessToken,
            @RequestBody BandPostCreateRequestDTO request) {
        try {
            Long currentUserId = jwtUtil.getUserId(accessToken);
            BandPostResponseDTO result = bandService.createBandPost(bandId, currentUserId, request);
            return ResponseEntity.status(HttpStatus.CREATED).body(result);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("message", e.getMessage()));
        }
    }

    /**
     * 밴드 게시글 수정
     */
    @PutMapping("/{bandId}/posts/{postId}")
    public ResponseEntity<?> updateBandPost(
            @PathVariable("bandId") Long bandId,
            @PathVariable("postId") Long postId,
            @RequestBody com.ourband.api.domain.dto.user.BandPostCreateRequestDTO request,
            @CookieValue(value = "access_token") String accessToken) {
        try {
            Long currentUserId = jwtUtil.getUserId(accessToken);
            BandPostResponseDTO result = bandService.updateBandPost(bandId, postId, currentUserId, request);
            return ResponseEntity.ok(result);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("message", e.getMessage()));
        }
    }

    /**
     * 밴드 게시글 삭제
     */
    @DeleteMapping("/{bandId}/posts/{postId}")
    public ResponseEntity<?> deleteBandPost(
            @PathVariable("bandId") Long bandId,
            @PathVariable("postId") Long postId,
            @CookieValue(value = "access_token") String accessToken) {
        try {
            Long currentUserId = jwtUtil.getUserId(accessToken);
            bandService.deleteBandPost(bandId, postId, currentUserId);
            return ResponseEntity.ok(Map.of("message", "게시글이 삭제되었습니다."));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("message", e.getMessage()));
        }
    }

    /**
     * 게시글 좋아요 토글
     */
    @PostMapping("/posts/{postId}/likes")
    public ResponseEntity<?> toggleLike(
            @PathVariable("postId") Long postId,
            @CookieValue(value = "access_token") String accessToken) {
        try {
            Long currentUserId = jwtUtil.getUserId(accessToken);
            boolean isLiked = bandService.toggleLike(postId, currentUserId);
            return ResponseEntity.ok(Map.of("isLiked", isLiked));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("message", e.getMessage()));
        }
    }

    /**
     * 게시글 댓글 작성
     */
    @PostMapping("/{bandId}/posts/{postId}/comments")
    public ResponseEntity<?> createComment(
            @PathVariable("bandId") Long bandId,
            @PathVariable("postId") Long postId,
            @CookieValue(value = "access_token") String accessToken,
            @RequestBody BandPostCommentCreateRequestDTO request) {
        try {
            Long currentUserId = jwtUtil.getUserId(accessToken);
            BandPostCommentResponseDTO result = bandService.createComment(postId, currentUserId, request);
            return ResponseEntity.status(HttpStatus.CREATED).body(result);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("message", e.getMessage()));
        }
    }
    /**
     * 투표하기
     */
    @PostMapping("/{bandId}/posts/{postId}/polls/{pollId}/vote")
    public ResponseEntity<?> votePoll(
            @PathVariable("bandId") Long bandId,
            @PathVariable("postId") Long postId,
            @PathVariable("pollId") Long pollId,
            @RequestParam("optionId") Long optionId,
            @CookieValue(value = "access_token") String accessToken) {
        try {
            Long currentUserId = jwtUtil.getUserId(accessToken);
            bandService.votePoll(pollId, optionId, currentUserId);
            return ResponseEntity.ok(Map.of("message", "투표가 반영되었습니다."));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("message", e.getMessage()));
        }
    }
}
