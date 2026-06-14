package com.ourband.api.domain.controller;

import com.ourband.api.domain.dto.community.*;
import com.ourband.api.domain.service.CommunityService;
import com.ourband.api.global.security.JwtUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/community")
@RequiredArgsConstructor
public class CommunityController {

    private final CommunityService communityService;
    private final JwtUtil jwtUtil;

    @GetMapping("/posts")
    public ResponseEntity<?> searchPosts(
            @RequestParam(name = "boardType", required = false) String boardType,
            @RequestParam(name = "category", required = false) String category,
            @RequestParam(name = "part", required = false) String part,
            @RequestParam(name = "keyword", required = false) String keyword,
            @RequestParam(name = "isPopular", required = false) Boolean isPopular,
            @CookieValue(value = "access_token", required = false) String accessToken,
            Pageable pageable) {
        try {
            Long currentUserId = null;
            if (accessToken != null && !accessToken.isEmpty()) {
                currentUserId = jwtUtil.getUserId(accessToken);
            }
            Page<CommunityPostResponseDTO> result = communityService.searchPosts(boardType, category, part, keyword, pageable, currentUserId, isPopular);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("message", e.getMessage() != null ? e.getMessage() : "Null message"));
        }
    }

    @GetMapping("/posts/{postId}")
    public ResponseEntity<?> getPost(
            @PathVariable("postId") Long postId,
            @CookieValue(value = "access_token", required = false) String accessToken) {
        try {
            Long currentUserId = null;
            if (accessToken != null && !accessToken.isEmpty()) {
                currentUserId = jwtUtil.getUserId(accessToken);
            }
            CommunityPostResponseDTO result = communityService.getPost(postId, currentUserId);
            return ResponseEntity.ok(result);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("message", e.getMessage()));
        }
    }

    @PostMapping("/posts")
    public ResponseEntity<?> createPost(
            @CookieValue(value = "access_token") String accessToken,
            @RequestBody CommunityPostCreateRequestDTO request) {
        try {
            Long currentUserId = jwtUtil.getUserId(accessToken);
            CommunityPostResponseDTO result = communityService.createPost(currentUserId, request);
            return ResponseEntity.status(HttpStatus.CREATED).body(result);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("message", e.getMessage()));
        }
    }

    @PutMapping("/posts/{postId}")
    public ResponseEntity<?> updatePost(
            @PathVariable("postId") Long postId,
            @CookieValue(value = "access_token") String accessToken,
            @RequestBody CommunityPostCreateRequestDTO request) {
        try {
            Long currentUserId = jwtUtil.getUserId(accessToken);
            CommunityPostResponseDTO result = communityService.updatePost(postId, currentUserId, request);
            return ResponseEntity.ok(result);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("message", e.getMessage()));
        }
    }

    @DeleteMapping("/posts/{postId}")
    public ResponseEntity<?> deletePost(
            @PathVariable("postId") Long postId,
            @CookieValue(value = "access_token") String accessToken) {
        try {
            Long currentUserId = jwtUtil.getUserId(accessToken);
            communityService.deletePost(postId, currentUserId);
            return ResponseEntity.ok(Map.of("message", "게시글이 삭제되었습니다."));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("message", e.getMessage()));
        }
    }

    @PostMapping("/posts/{postId}/likes")
    public ResponseEntity<?> toggleLike(
            @PathVariable("postId") Long postId,
            @CookieValue(value = "access_token") String accessToken) {
        try {
            Long currentUserId = jwtUtil.getUserId(accessToken);
            boolean isLiked = communityService.toggleLike(postId, currentUserId);
            return ResponseEntity.ok(Map.of("isLiked", isLiked));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("message", e.getMessage()));
        }
    }

    @PostMapping("/posts/{postId}/comments")
    public ResponseEntity<?> createComment(
            @PathVariable("postId") Long postId,
            @CookieValue(value = "access_token") String accessToken,
            @RequestBody CommunityPostCommentCreateRequestDTO request) {
        try {
            Long currentUserId = jwtUtil.getUserId(accessToken);
            CommunityPostCommentResponseDTO result = communityService.createComment(postId, currentUserId, request);
            return ResponseEntity.status(HttpStatus.CREATED).body(result);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("message", e.getMessage()));
        }
    }

    @PutMapping("/posts/{postId}/comments/{commentId}")
    public ResponseEntity<?> updateComment(
            @PathVariable("postId") Long postId,
            @PathVariable("commentId") Long commentId,
            @CookieValue(value = "access_token") String accessToken,
            @RequestBody CommunityPostCommentCreateRequestDTO request) {
        try {
            Long currentUserId = jwtUtil.getUserId(accessToken);
            CommunityPostCommentResponseDTO result = communityService.updateComment(commentId, currentUserId, request);
            return ResponseEntity.ok(result);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("message", e.getMessage()));
        }
    }

    @DeleteMapping("/posts/{postId}/comments/{commentId}")
    public ResponseEntity<?> deleteComment(
            @PathVariable("postId") Long postId,
            @PathVariable("commentId") Long commentId,
            @CookieValue(value = "access_token") String accessToken) {
        try {
            Long currentUserId = jwtUtil.getUserId(accessToken);
            communityService.deleteComment(commentId, currentUserId);
            return ResponseEntity.ok(Map.of("message", "댓글이 삭제되었습니다."));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("message", e.getMessage()));
        }
    }

    @PostMapping("/posts/{postId}/polls/{pollId}/vote")
    public ResponseEntity<?> votePoll(
            @PathVariable("postId") Long postId,
            @PathVariable("pollId") Long pollId,
            @RequestParam("optionId") Long optionId,
            @CookieValue(value = "access_token") String accessToken) {
        try {
            Long currentUserId = jwtUtil.getUserId(accessToken);
            communityService.votePoll(pollId, optionId, currentUserId);
            return ResponseEntity.ok(Map.of("message", "투표가 반영되었습니다."));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("message", e.getMessage()));
        }
    }
}
