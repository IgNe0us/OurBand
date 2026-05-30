package com.ourband.api.domain.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "band_applications")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder
public class BandApplication {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "band_id", nullable = false)
    private Long bandId;

    @Column(name = "band_member_id", nullable = false)
    private Long bandMemberId;

    @Column(name = "applicant_user_id", nullable = false)
    private Long applicantUserId;

    @Column(columnDefinition = "TEXT")
    private String message;

    @Builder.Default
    @Column(length = 20, nullable = false)
    private String status = "PENDING"; // PENDING, ACCEPTED, REJECTED

    @Column(name = "reject_reason", columnDefinition = "TEXT")
    private String rejectReason;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    public void accept() {
        this.status = "ACCEPTED";
    }

    public void reject(String reason) {
        this.status = "REJECTED";
        this.rejectReason = reason;
    }
}
