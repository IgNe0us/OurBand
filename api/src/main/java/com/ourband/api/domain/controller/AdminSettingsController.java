package com.ourband.api.domain.controller;

import com.ourband.api.domain.dto.admin.SiteSettingDTO;
import com.ourband.api.domain.service.SiteSettingsService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/admin/settings")
@RequiredArgsConstructor
public class AdminSettingsController {

    private final SiteSettingsService siteSettingsService;

    @GetMapping
    public ResponseEntity<List<SiteSettingDTO>> getAllSettings() {
        return ResponseEntity.ok(siteSettingsService.getAllSettings());
    }

    @PostMapping
    public ResponseEntity<Void> updateSettings(@RequestBody Map<String, String> updates) {
        siteSettingsService.updateMultipleSettings(updates);
        return ResponseEntity.ok().build();
    }
}
