package com.ourband.api.domain.controller;

import com.ourband.api.domain.service.SignupConfigService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/admin/signup-config")
@RequiredArgsConstructor
public class AdminSignupConfigController {

    private final SignupConfigService signupConfigService;

    @GetMapping("/forbidden-words")
    public ResponseEntity<List<String>> getForbiddenWords() {
        return ResponseEntity.ok(signupConfigService.getAllForbiddenWords());
    }

    @PostMapping("/forbidden-words")
    public ResponseEntity<?> addForbiddenWord(@RequestParam("word") String word) {
        signupConfigService.addForbiddenWord(word);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/forbidden-words")
    public ResponseEntity<?> deleteForbiddenWord(@RequestParam("word") String word) {
        signupConfigService.deleteForbiddenWord(word);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/positions")
    public ResponseEntity<List<String>> getPositions() {
        return ResponseEntity.ok(signupConfigService.getAllPositions());
    }

    @PostMapping("/positions")
    public ResponseEntity<?> addPosition(@RequestParam("positionName") String positionName) {
        signupConfigService.addPosition(positionName);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/positions")
    public ResponseEntity<?> deletePosition(@RequestParam("positionName") String positionName) {
        signupConfigService.deletePosition(positionName);
        return ResponseEntity.ok().build();
    }
}
