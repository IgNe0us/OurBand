package com.ourband.api.domain.model;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;

@Entity
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "profile") // 첨부된 DB 이름과 동일
public class Profile { // 💡 주의: BaseEntity 상속 안 함 (DB에 created_at이 없으므로)

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(columnDefinition = "TEXT")
    private String bio;

    @Column(name = "experience_level", length = 50)
    private String experienceLevel;

    @Column(name = "main_genre", length = 100)
    private String mainGenre;

    @Column(precision = 4, scale = 1)
    @Builder.Default // Builder 패턴 사용 시 기본값 유지
    private BigDecimal potential = new BigDecimal("0"); // 포텐셜 기본값

    @Column(name = "profile_picture_url", length = 1024)
    private String profilePictureUrl;

    @Column(name = "profile_background_picture_url", length = 1024)
    private String profileBackgroundPictureUrl;

    @Column(length = 100)
    private String instrument; // 💡 DTO에서 받은 악기 포지션이 저장될 곳

    private Integer level;

    private String location;
}