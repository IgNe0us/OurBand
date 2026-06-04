package com.ourband.api.domain.controller;

import com.ourband.api.domain.dto.report.ReportCreateRequestDTO;
import com.ourband.api.domain.service.ReportService;
import com.ourband.api.global.security.JwtUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/reports")
@RequiredArgsConstructor
public class ReportController {

    private final ReportService reportService;
    private final JwtUtil jwtUtil;

    @PostMapping
    public ResponseEntity<?> createReport(
            @CookieValue(value = "access_token") String accessToken,
            @RequestBody ReportCreateRequestDTO request) {
        try {
            Long currentUserId = jwtUtil.getUserId(accessToken);
            reportService.createReport(currentUserId, request);
            return ResponseEntity.status(HttpStatus.CREATED).body(Map.of("message", "신고가 접수되었습니다."));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("message", e.getMessage()));
        }
    }
}
