package com.ourband.api.domain.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import java.time.LocalDateTime;

@Entity
@Table(name = "reports")
@Getter
@Setter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder
public class Report {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "reporter_id", nullable = false)
    private Long reporterId;

    @Column(name = "target_type", nullable = false, length = 50)
    private String targetType; // "POST", "COMMENT"

    @Column(name = "target_id", nullable = false)
    private Long targetId;

    @Column(nullable = false, length = 500)
    private String reason;

    @Column(nullable = false, length = 50)
    @Builder.Default
    private String status = "PENDING"; // "PENDING", "RESOLVED", "REJECTED"

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
}
