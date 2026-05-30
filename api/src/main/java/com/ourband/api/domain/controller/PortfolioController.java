package com.ourband.api.domain.controller;

import com.ourband.api.domain.dto.portfolio.PortfolioCreateRequestDTO;
import com.ourband.api.domain.dto.portfolio.PortfolioResponseDTO;
import com.ourband.api.domain.service.PortfolioService;
import com.ourband.api.global.security.JwtUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/portfolios")
@RequiredArgsConstructor
public class PortfolioController {

    private final PortfolioService portfolioService;
    private final JwtUtil jwtUtil;

    @PostMapping
    public ResponseEntity<?> createPortfolio(
            @CookieValue(value = "access_token") String accessToken,
            @RequestBody PortfolioCreateRequestDTO request) {
        try {
            Long userId = jwtUtil.getUserId(accessToken);
            PortfolioResponseDTO response = portfolioService.createPortfolio(userId, request);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @GetMapping("/users/{targetUserId}")
    public ResponseEntity<?> getUserPortfolios(
            @PathVariable("targetUserId") Long targetUserId,
            @CookieValue(value = "access_token", required = false) String accessToken,
            @RequestParam(value = "page", defaultValue = "0") int page,
            @RequestParam(value = "size", defaultValue = "10") int size) {
        try {
            Long currentUserId = null;
            if (accessToken != null) {
                try {
                    currentUserId = jwtUtil.getUserId(accessToken);
                } catch (Exception ignored) {}
            }
            Page<PortfolioResponseDTO> response = portfolioService.getUserPortfolios(targetUserId, currentUserId, page, size);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @DeleteMapping("/{portfolioId}")
    public ResponseEntity<?> deletePortfolio(
            @CookieValue(value = "access_token") String accessToken,
            @PathVariable("portfolioId") Long portfolioId) {
        try {
            Long userId = jwtUtil.getUserId(accessToken);
            portfolioService.deletePortfolio(userId, portfolioId);
            return ResponseEntity.ok(Map.of("message", "Deleted successfully"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }
}
