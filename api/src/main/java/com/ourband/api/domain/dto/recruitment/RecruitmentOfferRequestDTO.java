package com.ourband.api.domain.dto.recruitment;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RecruitmentOfferRequestDTO {
    private Long bandId;
    private Long targetUserId;
    private Long seekingPostId;
    private String position;
    private String message;
}
