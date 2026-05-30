package com.ourband.api.domain.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "member_seeking_posts")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder
public class MemberSeekingPost {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(nullable = false, length = 200)
    private String title;

    @Column(columnDefinition = "TEXT", nullable = false)
    private String content;

    @Column(nullable = false, length = 50)
    private String position;

    @Column(length = 100)
    private String location;

    @Column(name = "genre_style", length = 200)
    private String genreStyle;

    @Column(name = "media_url", length = 1024)
    private String mediaUrl;

    @Column(name = "media_type", length = 20)
    private String mediaType; // VIDEO or IMAGE

    @Builder.Default
    @Column(length = 20, nullable = false)
    private String status = "OPEN";

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    public void update(String title, String content, String position, String location, String genreStyle, String mediaUrl, String mediaType, String status) {
        this.title = title;
        this.content = content;
        this.position = position;
        this.location = location;
        this.genreStyle = genreStyle;
        this.mediaUrl = mediaUrl;
        this.mediaType = mediaType;
        this.status = status;
    }

    public void updateStatus(String status) {
        this.status = status;
    }
}
