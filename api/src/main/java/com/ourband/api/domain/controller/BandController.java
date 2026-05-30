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

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;

@RestController
@RequestMapping("/api/v1/bands")
@RequiredArgsConstructor
public class BandController {

    private final BandService bandService;
    private final JwtUtil jwtUtil;

    /**
     * 밴드 목록 검색
     */
    @GetMapping
    public ResponseEntity<?> searchBands(
            @RequestParam(value = "genre", required = false) String genre,
            @RequestParam(value = "location", required = false) String location,
            @RequestParam(value = "keyword", required = false) String keyword,
            @RequestParam(value = "recruitingOnly", required = false) Boolean recruitingOnly,
            @RequestParam(value = "followedOnly", required = false) Boolean followedOnly,
            @RequestParam(value = "page", defaultValue = "0") int page,
            @RequestParam(value = "size", defaultValue = "12") int size,
            @CookieValue(value = "access_token", required = false) String accessToken) {
        try {
            Long currentUserId = null;
            if (accessToken != null && !accessToken.isEmpty()) {
                currentUserId = jwtUtil.getUserId(accessToken);
            }
            Pageable pageable = PageRequest.of(page, size);
            Page<BandListResponseDTO> result = bandService.searchBands(genre, location, keyword, recruitingOnly, followedOnly, currentUserId, pageable);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("message", e.getMessage()));
        }
    }

    /**
     * 밴드 팔로우 토글
     */
    @PostMapping("/{bandId}/follow")
    public ResponseEntity<?> toggleFollow(
            @PathVariable("bandId") Long bandId,
            @CookieValue(value = "access_token") String accessToken) {
        try {
            Long currentUserId = jwtUtil.getUserId(accessToken);
            boolean isFollowed = bandService.toggleFollow(bandId, currentUserId);
            return ResponseEntity.ok(Map.of("isFollowed", isFollowed));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("message", e.getMessage()));
        }
    }

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
     * 댓글 수정
     */
    @PutMapping("/{bandId}/posts/{postId}/comments/{commentId}")
    public ResponseEntity<?> updateComment(
            @PathVariable("bandId") Long bandId,
            @PathVariable("postId") Long postId,
            @PathVariable("commentId") Long commentId,
            @CookieValue(value = "access_token") String accessToken,
            @RequestBody BandPostCommentCreateRequestDTO request) {
        try {
            Long currentUserId = jwtUtil.getUserId(accessToken);
            BandPostCommentResponseDTO result = bandService.updateComment(commentId, currentUserId, request.getContent());
            return ResponseEntity.ok(result);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("message", e.getMessage()));
        }
    }

    /**
     * 댓글 삭제
     */
    @DeleteMapping("/{bandId}/posts/{postId}/comments/{commentId}")
    public ResponseEntity<?> deleteComment(
            @PathVariable("bandId") Long bandId,
            @PathVariable("postId") Long postId,
            @PathVariable("commentId") Long commentId,
            @CookieValue(value = "access_token") String accessToken) {
        try {
            Long currentUserId = jwtUtil.getUserId(accessToken);
            bandService.deleteComment(commentId, currentUserId);
            return ResponseEntity.ok(Map.of("message", "댓글이 삭제되었습니다."));
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

    // ========================================
    // 💡 밴드 가입 신청 API
    // ========================================

    @PostMapping("/{bandId}/applications")
    public ResponseEntity<?> createApplication(
            @PathVariable("bandId") Long bandId,
            @CookieValue(value = "access_token") String accessToken,
            @RequestBody BandApplicationRequestDTO request) {
        try {
            Long currentUserId = jwtUtil.getUserId(accessToken);
            BandApplicationResponseDTO result = bandService.createApplication(bandId, currentUserId, request);
            return ResponseEntity.status(HttpStatus.CREATED).body(result);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("message", e.getMessage()));
        }
    }

    @GetMapping("/applications/my")
    public ResponseEntity<?> getMyApplications(@CookieValue(value = "access_token") String accessToken) {
        try {
            Long currentUserId = jwtUtil.getUserId(accessToken);
            List<BandApplicationResponseDTO> result = bandService.getMyApplications(currentUserId);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("message", e.getMessage()));
        }
    }

    @GetMapping("/{bandId}/applications")
    public ResponseEntity<?> getBandApplications(
            @PathVariable("bandId") Long bandId,
            @CookieValue(value = "access_token") String accessToken) {
        try {
            Long currentUserId = jwtUtil.getUserId(accessToken);
            List<BandApplicationResponseDTO> result = bandService.getBandApplications(bandId, currentUserId);
            return ResponseEntity.ok(result);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("message", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("message", e.getMessage()));
        }
    }

    @PatchMapping("/applications/{id}/accept")
    public ResponseEntity<?> acceptApplication(
            @PathVariable("id") Long id,
            @CookieValue(value = "access_token") String accessToken) {
        try {
            Long currentUserId = jwtUtil.getUserId(accessToken);
            bandService.acceptApplication(id, currentUserId);
            return ResponseEntity.ok(Map.of("message", "가입 신청이 수락되었습니다."));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("message", e.getMessage()));
        }
    }

    @PatchMapping("/applications/{id}/reject")
    public ResponseEntity<?> rejectApplication(
            @PathVariable("id") Long id,
            @RequestParam(value = "reason", required = false) String reason,
            @CookieValue(value = "access_token") String accessToken) {
        try {
            Long currentUserId = jwtUtil.getUserId(accessToken);
            bandService.rejectApplication(id, currentUserId, reason);
            return ResponseEntity.ok(Map.of("message", "가입 신청이 거절되었습니다."));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("message", e.getMessage()));
        }
    }
    /**
     * 밴드 탈퇴 (일반 멤버용)
     */
    @DeleteMapping("/{bandId}/leave")
    public ResponseEntity<?> leaveBand(
            @PathVariable("bandId") Long bandId,
            @CookieValue(value = "access_token") String accessToken) {
        try {
            Long currentUserId = jwtUtil.getUserId(accessToken);
            bandService.leaveBand(bandId, currentUserId);
            return ResponseEntity.ok(Map.of("message", "밴드에서 성공적으로 탈퇴했습니다."));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("message", e.getMessage()));
        }
    }

    /**
     * 밴드 해체 (방장용)
     */
    @DeleteMapping("/{bandId}")
    public ResponseEntity<?> deleteBand(
            @PathVariable("bandId") Long bandId,
            @CookieValue(value = "access_token") String accessToken) {
        try {
            Long currentUserId = jwtUtil.getUserId(accessToken);
            bandService.deleteBand(bandId, currentUserId);
            return ResponseEntity.ok(Map.of("message", "밴드가 성공적으로 해체되었습니다."));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("message", e.getMessage()));
        }
    }
}
