package com.ourband.api.domain.controller;

import com.ourband.api.domain.dto.studio.StudioCreateRequestDTO;
import com.ourband.api.domain.dto.studio.StudioListResponseDTO;
import com.ourband.api.domain.dto.studio.StudioResponseDTO;
import com.ourband.api.domain.service.StudioService;
import com.ourband.api.global.security.JwtUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/studios")
@RequiredArgsConstructor
public class StudioController {

    private final StudioService studioService;
    private final JwtUtil jwtUtil;

    @GetMapping
    public ResponseEntity<List<StudioListResponseDTO>> getStudiosWithinRadius(
            @RequestParam(name = "lat") double lat,
            @RequestParam(name = "lng") double lng,
            @RequestParam(name = "radius") double radius) {
        return ResponseEntity.ok(studioService.getStudiosWithinRadius(lat, lng, radius));
    }

    @GetMapping("/{id}")
    public ResponseEntity<StudioResponseDTO> getStudioById(@PathVariable(name = "id") Long id) {
        return ResponseEntity.ok(studioService.getStudioById(id));
    }

    @PostMapping
    public ResponseEntity<?> createStudio(
            @CookieValue(value = "access_token", required = false) String accessToken,
            @RequestBody StudioCreateRequestDTO request) {
        try {
            if (accessToken == null || accessToken.isEmpty()) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(Map.of("message", "로그인이 필요합니다."));
            }
            Long currentUserId = jwtUtil.getUserId(accessToken);
            return ResponseEntity.ok(studioService.createStudio(currentUserId, request));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("message", e.getMessage()));
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateStudio(
            @PathVariable(name = "id") Long id,
            @CookieValue(value = "access_token", required = false) String accessToken,
            @RequestBody StudioCreateRequestDTO request) {
        try {
            if (accessToken == null || accessToken.isEmpty()) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(Map.of("message", "로그인이 필요합니다."));
            }
            Long currentUserId = jwtUtil.getUserId(accessToken);
            return ResponseEntity.ok(studioService.updateStudio(id, currentUserId, request));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("message", e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteStudio(
            @PathVariable(name = "id") Long id,
            @CookieValue(value = "access_token", required = false) String accessToken) {
        try {
            if (accessToken == null || accessToken.isEmpty()) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(Map.of("message", "로그인이 필요합니다."));
            }
            Long currentUserId = jwtUtil.getUserId(accessToken);
            studioService.deleteStudio(id, currentUserId);
            return ResponseEntity.ok(Map.of("message", "합주실 정보가 삭제되었습니다."));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("message", e.getMessage()));
        }
    }

    @PostMapping("/{id}/report")
    public ResponseEntity<?> reportStudio(
            @PathVariable(name = "id") Long id,
            @CookieValue(value = "access_token", required = false) String accessToken,
            @RequestBody Map<String, String> request) {
        try {
            if (accessToken == null || accessToken.isEmpty()) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(Map.of("message", "로그인이 필요합니다."));
            }
            Long currentUserId = jwtUtil.getUserId(accessToken);
            String reason = request.getOrDefault("reason", "No reason provided");
            studioService.reportStudio(id, currentUserId, reason);
            return ResponseEntity.ok(Map.of("message", "신고가 접수되었습니다."));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("message", e.getMessage()));
        }
    }

    @PostMapping("/emergency-session")
    public ResponseEntity<?> callEmergencySession(
            @CookieValue(value = "access_token", required = false) String accessToken,
            @RequestBody com.ourband.api.domain.dto.studio.EmergencySessionRequestDTO request) {
        try {
            if (accessToken == null || accessToken.isEmpty()) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(Map.of("message", "로그인이 필요합니다."));
            }
            Long currentUserId = jwtUtil.getUserId(accessToken);
            studioService.callEmergencySession(request, currentUserId);
            return ResponseEntity.ok(Map.of("message", "긴급 세션 알림이 발송되었습니다."));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("message", e.getMessage()));
        }
    }
}
