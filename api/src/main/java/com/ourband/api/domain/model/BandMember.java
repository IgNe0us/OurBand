package com.ourband.api.domain.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "band_members") // 💡 캡처해주신 테이블명과 완벽 일치!
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder
public class BandMember {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "band_id", nullable = false)
    private Long bandId;

    // 💡 user_id는 '구인 중인 빈 자리'일 경우 NULL이 들어갈 수 있으므로 nullable = false를 빼줍니다.
    @Column(name = "user_id")
    private Long userId;

    @Column(nullable = false, length = 50)
    private String role; // 역할 (예: 보컬, 기타, 베이스, 건반)

    // 💡 DB 기본값이 'JOINED'이므로 자바 객체 생성 시에도 기본값을 넣어줍니다.
    @Builder.Default
    @Column(length = 20)
    private String status = "JOINED"; 

    @CreationTimestamp
    @Column(name = "joined_at", updatable = false)
    private LocalDateTime joinedAt; // 가입일 (또는 포지션 생성일)

    public void leave() {
        this.userId = null;
        this.status = "NONE";
    }
}