package com.ourband.api.domain.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "follows")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder
public class Follow {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // 객체 매핑(User) 대신 심플하게 ID만 저장하는 방식 (성능상 유리)
    @Column(name = "follower_id", nullable = false)
    private Long followerId; // 팔로우를 하는 사람 (나)

    @Column(name = "following_id", nullable = false)
    private Long followingId; // 팔로우를 받는 사람 (상대방)

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
}