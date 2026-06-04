package com.ourband.api.domain.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.util.StringUtils;

import java.io.IOException;
import java.nio.file.*;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/uploads")
public class UploadController {

    private final String UPLOAD_DIR = "uploads/";

    public UploadController() {
        try {
            Files.createDirectories(Paths.get(UPLOAD_DIR));
        } catch (IOException e) {
            throw new RuntimeException("Could not create upload directory!");
        }
    }

    @PostMapping
    public ResponseEntity<?> uploadFile(@RequestParam("file") MultipartFile file) {
        if (file.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("message", "File is empty"));
        }

        try {
            String originalFileName = StringUtils.cleanPath(file.getOriginalFilename());
            String fileExtension = "";
            if (originalFileName.contains(".")) {
                fileExtension = originalFileName.substring(originalFileName.lastIndexOf("."));
            }
            String newFileName = UUID.randomUUID().toString() + fileExtension;
            Path targetLocation = Paths.get(UPLOAD_DIR).resolve(newFileName);
            Files.copy(file.getInputStream(), targetLocation, StandardCopyOption.REPLACE_EXISTING);

            String fileUrl = "/uploads/" + newFileName;
            return ResponseEntity.ok(Map.of("url", "http://152.69.227.244:8082" + fileUrl, "mediaType", getMediaType(fileExtension)));
        } catch (IOException ex) {
            return ResponseEntity.internalServerError().body(Map.of("message", "Could not upload file"));
        }
    }

    private String getMediaType(String extension) {
        extension = extension.toLowerCase();
        if (extension.matches(".*\\.(mp4|mov|webm|avi|mkv|wmv).*")) {
            return "VIDEO";
        }
        return "IMAGE";
    }
}
