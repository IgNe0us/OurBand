package com.ourband.api.domain.model;

import java.time.LocalDateTime;

import org.hibernate.annotations.CreationTimestamp;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "history_media")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder
public class UserHistoryMedia {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "history_id", nullable = false)
    private Long historyId;

    // 💡 DB 컬럼명에 맞춰 media_url 로 변경
    @Column(name = "media_url", length = 1024, nullable = false)
    private String mediaUrl;

    // 💡 DB 컬럼명에 맞춰 media_type 로 변경
    @Column(name = "media_type", length = 50, nullable = false)
    private String mediaType;

    // 💡 추가된 정렬 순서 컬럼
    @Column(name = "sort_order")
    private Integer sortOrder;

    // 💡 추가된 생성일자 컬럼
    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
}