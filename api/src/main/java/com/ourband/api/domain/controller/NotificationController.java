package com.ourband.api.domain.controller;

import com.ourband.api.domain.dto.user.NotificationResponseDTO;
import com.ourband.api.domain.service.NotificationService;
import com.ourband.api.global.security.JwtUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;
    private final JwtUtil jwtUtil;

    @GetMapping(value = "/subscribe", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter subscribe(@CookieValue(value = "access_token") String accessToken) {
        Long userId = jwtUtil.getUserId(accessToken);
        return notificationService.subscribe(userId);
    }

    @GetMapping
    public ResponseEntity<List<NotificationResponseDTO>> getNotifications(@CookieValue(value = "access_token") String accessToken) {
        Long userId = jwtUtil.getUserId(accessToken);
        return ResponseEntity.ok(notificationService.getNotifications(userId));
    }

    @GetMapping("/unread-count")
    public ResponseEntity<Map<String, Integer>> getUnreadCount(@CookieValue(value = "access_token") String accessToken) {
        Long userId = jwtUtil.getUserId(accessToken);
        return ResponseEntity.ok(Map.of("count", notificationService.getUnreadCount(userId)));
    }

    @PutMapping("/{id}/read")
    public ResponseEntity<?> markAsRead(@PathVariable("id") Long id, @CookieValue(value = "access_token") String accessToken) {
        try {
            Long userId = jwtUtil.getUserId(accessToken);
            notificationService.markAsRead(id, userId);
            return ResponseEntity.ok().build();
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }
}
