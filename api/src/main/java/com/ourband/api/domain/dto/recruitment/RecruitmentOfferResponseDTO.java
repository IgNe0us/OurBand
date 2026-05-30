package com.ourband.api.domain.dto.recruitment;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RecruitmentOfferResponseDTO {
    private Long id;
    private Long bandId;
    private String bandName;
    private String bandLogoUrl;
    private Long senderUserId;
    private Long targetUserId;
    private Long seekingPostId;
    private String position;
    private String message;
    private String status;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
