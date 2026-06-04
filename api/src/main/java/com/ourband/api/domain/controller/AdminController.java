package com.ourband.api.domain.controller;

import com.ourband.api.domain.dto.admin.AdminUserResponseDTO;
import com.ourband.api.domain.dto.admin.AdminContentResponseDTO;
import com.ourband.api.domain.dto.admin.AdminReportResponseDTO;
import com.ourband.api.domain.dto.admin.AdminStatisticsResponseDTO;
import com.ourband.api.domain.service.AdminUserService;
import com.ourband.api.domain.service.AdminContentService;
import com.ourband.api.domain.service.AdminReportService;
import com.ourband.api.domain.service.AdminStatisticsService;
import com.ourband.api.domain.service.VisitorService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/admin")
@RequiredArgsConstructor
public class AdminController {

    private final AdminUserService adminUserService;
    private final AdminContentService adminContentService;
    private final AdminReportService adminReportService;
    private final AdminStatisticsService adminStatisticsService;
    private final VisitorService visitorService;

    // --- Users ---
    @GetMapping("/users")
    public ResponseEntity<List<AdminUserResponseDTO>> getAllUsers() {
        return ResponseEntity.ok(adminUserService.getAllUsers());
    }

    @PutMapping("/users/{userId}/status")
    public ResponseEntity<Void> updateUserStatus(@PathVariable("userId") Long userId, @RequestBody Map<String, String> body) {
        String status = body.get("status");
        Integer suspendDays = null;
        if (body.get("suspendDays") != null) {
            try {
                suspendDays = Integer.parseInt(body.get("suspendDays"));
            } catch (NumberFormatException e) {
                // Ignore parsing error, default to null
            }
        }
        String suspendReason = body.get("suspendReason");
        adminUserService.updateUserStatus(userId, status, suspendDays, suspendReason);
        return ResponseEntity.ok().build();
    }

    @PutMapping("/users/{userId}/role")
    public ResponseEntity<Void> updateUserRole(@PathVariable("userId") Long userId, @RequestBody Map<String, String> body) {
        String role = body.get("role");
        adminUserService.updateUserRole(userId, role);
        return ResponseEntity.ok().build();
    }

    // --- Contents ---
    @GetMapping("/contents")
    public ResponseEntity<List<AdminContentResponseDTO>> getAllContents() {
        return ResponseEntity.ok(adminContentService.getAllContents());
    }

    @DeleteMapping("/contents/{type}/{id}")
    public ResponseEntity<Void> deleteContent(@PathVariable("type") String type, @PathVariable("id") String id) {
        adminContentService.deleteContent(type, id);
        return ResponseEntity.ok().build();
    }

    @PutMapping("/contents/{type}/{id}/visibility")
    public ResponseEntity<Void> toggleContentVisibility(@PathVariable("type") String type, @PathVariable("id") String id) {
        adminContentService.toggleContentVisibility(type, id);
        return ResponseEntity.ok().build();
    }

    // --- Reports ---
    @GetMapping("/reports")
    public ResponseEntity<List<AdminReportResponseDTO>> getAllReports() {
        return ResponseEntity.ok(adminReportService.getAllReports());
    }

    @PutMapping("/reports/{reportId}/status")
    public ResponseEntity<Void> updateReportStatus(@PathVariable("reportId") Long reportId, @RequestBody Map<String, String> body) {
        String status = body.get("status");
        adminReportService.updateReportStatus(reportId, status);
        return ResponseEntity.ok().build();
    }

    // --- Statistics ---
    @GetMapping("/statistics")
    public ResponseEntity<AdminStatisticsResponseDTO> getStatistics() {
        return ResponseEntity.ok(adminStatisticsService.getStatistics());
    }

    @GetMapping("/visitor-trends")
    public ResponseEntity<List<com.ourband.api.domain.dto.admin.DailyVisitorResponseDTO>> getVisitorTrends() {
        return ResponseEntity.ok(visitorService.getVisitorTrends());
    }
}
