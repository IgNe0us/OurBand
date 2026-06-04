package com.ourband.api.domain.controller;

import com.ourband.api.domain.service.SignupConfigService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/public/signup-config")
@RequiredArgsConstructor
public class PublicSignupConfigController {

    private final SignupConfigService signupConfigService;

    @GetMapping
    public ResponseEntity<Map<String, List<String>>> getSignupConfig() {
        Map<String, List<String>> config = new HashMap<>();
        config.put("forbiddenWords", signupConfigService.getAllForbiddenWords());
        config.put("positions", signupConfigService.getAllPositions());
        return ResponseEntity.ok(config);
    }
}
