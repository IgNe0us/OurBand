package com.ourband.api.domain.controller;

import com.ourband.api.domain.dto.jam.JamPostCreateRequestDTO;
import com.ourband.api.domain.dto.jam.JamPostResponseDTO;
import com.ourband.api.domain.dto.jam.JamPostCommentCreateRequestDTO;
import com.ourband.api.domain.dto.jam.JamPostCommentResponseDTO;
import com.ourband.api.domain.service.JamService;
import com.ourband.api.global.security.JwtUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/jams")
@RequiredArgsConstructor
public class JamController {

    private final JamService jamService;
    private final JwtUtil jwtUtil;

    @PostMapping
    public ResponseEntity<?> createJamPost(
            @CookieValue(value = "access_token") String accessToken,
            @RequestBody JamPostCreateRequestDTO request) {
        try {
            Long userId = jwtUtil.getUserId(accessToken);
            JamPostResponseDTO response = jamService.createJamPost(userId, request);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @DeleteMapping("/{jamId}")
    public ResponseEntity<?> deleteJamPost(
            @CookieValue(value = "access_token") String accessToken,
            @PathVariable("jamId") Long jamId) {
        try {
            Long userId = jwtUtil.getUserId(accessToken);
            jamService.deleteJamPost(jamId, userId);
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @GetMapping("/{jamId}")
    public ResponseEntity<?> getJamPost(
            @PathVariable("jamId") Long jamId,
            @CookieValue(value = "access_token", required = false) String accessToken) {
        try {
            Long currentUserId = null;
            if (accessToken != null) {
                try {
                    currentUserId = jwtUtil.getUserId(accessToken);
                } catch (Exception ignored) {
                }
            }
            JamPostResponseDTO response = jamService.getJamPost(jamId, currentUserId);
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("message", "서버 오류가 발생했습니다."));
        }
    }

    @GetMapping
    public ResponseEntity<?> searchJamPosts(
            @CookieValue(value = "access_token", required = false) String accessToken,
            @RequestParam(value = "genre", required = false) String genre,
            @RequestParam(value = "instrument", required = false) String instrument,
            @RequestParam(value = "page", defaultValue = "0") int page,
            @RequestParam(value = "size", defaultValue = "10") int size) {
        try {
            Long currentUserId = null;
            if (accessToken != null && !accessToken.isEmpty()) {
                try {
                    currentUserId = jwtUtil.getUserId(accessToken);
                } catch (Exception ignored) {
                }
            }
            Page<JamPostResponseDTO> response = jamService.searchJamPosts(genre, instrument, page, size, currentUserId);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @GetMapping("/users/{targetUserId}")
    public ResponseEntity<?> getUserJamPosts(
            @CookieValue(value = "access_token", required = false) String accessToken,
            @PathVariable("targetUserId") Long targetUserId,
            @RequestParam(value = "page", defaultValue = "0") int page,
            @RequestParam(value = "size", defaultValue = "10") int size) {
        try {
            Long currentUserId = null;
            if (accessToken != null && !accessToken.isEmpty()) {
                try {
                    currentUserId = jwtUtil.getUserId(accessToken);
                } catch (Exception ignored) {
                }
            }
            Page<JamPostResponseDTO> response = jamService.getUserJamPosts(targetUserId, page, size, currentUserId);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @PostMapping("/{jamId}/view")
    public ResponseEntity<?> incrementViewCount(@PathVariable("jamId") Long jamId) {
        try {
            jamService.incrementViewCount(jamId);
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @PostMapping("/{jamId}/like")
    public ResponseEntity<?> toggleLike(
            @CookieValue(value = "access_token") String accessToken,
            @PathVariable("jamId") Long jamId) {
        try {
            Long userId = jwtUtil.getUserId(accessToken);
            boolean isLiked = jamService.toggleLike(userId, jamId);
            return ResponseEntity.ok(Map.of("isLiked", isLiked));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @PostMapping("/{jamId}/comments")
    public ResponseEntity<?> createComment(
            @CookieValue(value = "access_token") String accessToken,
            @PathVariable("jamId") Long jamId,
            @RequestBody JamPostCommentCreateRequestDTO request) {
        try {
            Long userId = jwtUtil.getUserId(accessToken);
            JamPostCommentResponseDTO response = jamService.createComment(userId, jamId, request);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @GetMapping("/{jamId}/comments")
    public ResponseEntity<?> getComments(@PathVariable("jamId") Long jamId) {
        try {
            List<JamPostCommentResponseDTO> response = jamService.getComments(jamId);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @PutMapping("/{jamId}/comments/{commentId}")
    public ResponseEntity<?> updateComment(
            @PathVariable("jamId") Long jamId,
            @PathVariable("commentId") Long commentId,
            @CookieValue(value = "access_token") String accessToken,
            @RequestBody JamPostCommentCreateRequestDTO request) {
        try {
            Long userId = jwtUtil.getUserId(accessToken);
            JamPostCommentResponseDTO response = jamService.updateComment(commentId, userId, request);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @DeleteMapping("/{jamId}/comments/{commentId}")
    public ResponseEntity<?> deleteComment(
            @PathVariable("jamId") Long jamId,
            @PathVariable("commentId") Long commentId,
            @CookieValue(value = "access_token") String accessToken) {
        try {
            Long userId = jwtUtil.getUserId(accessToken);
            jamService.deleteComment(commentId, userId);
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @PostMapping("/{jamId}/share")
    public ResponseEntity<?> incrementShareCount(@PathVariable("jamId") Long jamId) {
        try {
            jamService.incrementShareCount(jamId);
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }
}
