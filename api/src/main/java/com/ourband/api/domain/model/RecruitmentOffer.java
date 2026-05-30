package com.ourband.api.domain.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "recruitment_offers")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder
public class RecruitmentOffer {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "band_id", nullable = false)
    private Long bandId;

    @Column(name = "sender_user_id", nullable = false)
    private Long senderUserId;

    @Column(name = "target_user_id", nullable = false)
    private Long targetUserId;

    @Column(name = "seeking_post_id", nullable = false)
    private Long seekingPostId;

    @Column(nullable = false, length = 50)
    private String position;

    @Column(columnDefinition = "TEXT")
    private String message;

    @Builder.Default
    @Column(length = 20, nullable = false)
    private String status = "PENDING"; // PENDING, ACCEPTED, REJECTED

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    public void accept() {
        this.status = "ACCEPTED";
    }

    public void reject() {
        this.status = "REJECTED";
    }
}
