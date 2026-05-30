package com.ourband.api.domain.dto.user;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BandApplicationResponseDTO {
    private Long id;
    private Long bandId;
    private String bandName;
    private String bandLogoUrl;
    private Long bandMemberId;
    private String position;
    private Long applicantUserId;
    private String applicantName;
    private String applicantProfileImageUrl;
    private String message;
    private String status;
    private String rejectReason;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
