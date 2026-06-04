package com.ourband.api.domain.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import java.time.LocalDateTime;

@Entity
@Table(name = "band_posts")
@Getter
@Setter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder
public class BandPost {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "band_id", nullable = false)
    private Long bandId;

    @Column(name = "user_id", nullable = false)
    private Long authorId;

    @Column(name = "board_type", nullable = false, length = 50)
    private String boardType; // "NOTICE", "FREE", "SCHEDULE", "REHEARSAL"

    @Column(length = 50)
    private String category; // 말머리 (예: 일반, 잡담, 질문, 정보, 장비 등)

    @Column(nullable = false, length = 255)
    private String title;

    @Column(columnDefinition = "TEXT", nullable = false)
    private String content;

    // 합주 영상/사진을 위한 컬럼
    @Column(name = "media_url", length = 1024)
    private String mediaUrl;

    @Column(name = "media_type", length = 50)
    private String mediaType; // "VIDEO", "IMAGE"

    // 합주 일정을 위한 컬럼
    @Column(name = "schedule_date", length = 100)
    private String scheduleDate; // 예: "2026.06.15"

    @Column(name = "schedule_details", columnDefinition = "TEXT")
    private String scheduleDetails; // 합주 투표 현황 등 상세 내역

    @Column(name = "like_count", nullable = false)
    @Builder.Default
    private Integer likeCount = 0;

    @Column(name = "comment_count", nullable = false)
    @Builder.Default
    private Integer commentCount = 0;

    @Column(name = "is_hidden", nullable = false)
    @Builder.Default
    private boolean isHidden = false;

    @Column(name = "is_deleted", nullable = false)
    @Builder.Default
    private boolean isDeleted = false;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
