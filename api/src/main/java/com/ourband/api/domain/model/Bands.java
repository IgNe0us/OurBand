package com.ourband.api.domain.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "bands") // band 테이블 삭제 후 bands 테이블 사용
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder
public class Bands {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 100)
    private String name;

    @Column(columnDefinition = "TEXT")
    private String description;

    private String genre;

    @Column(name = "meeting_schedule", length = 100)
    private String meetingSchedule;

    private String location;

    // 테이블 캡처 화면에 있던 컬럼명과 매핑
    @Column(name = "logo_image_url", length = 1024)
    private String logoImageUrl;

    @Column(name = "cover_image_url", length = 1024)
    private String coverImageUrl;

    @Column(name = "history_json", columnDefinition = "TEXT")
    private String historyJson;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    public void updateProfile(String name, String description, String genre, String meetingSchedule, String location, String logoImageUrl, String coverImageUrl, String historyJson) {
        this.name = name;
        this.description = description;
        this.genre = genre;
        this.meetingSchedule = meetingSchedule;
        this.location = location;
        this.logoImageUrl = logoImageUrl;
        this.coverImageUrl = coverImageUrl;
        this.historyJson = historyJson;
    }
}