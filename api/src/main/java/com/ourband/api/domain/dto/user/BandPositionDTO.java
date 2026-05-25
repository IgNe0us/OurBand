package com.ourband.api.domain.dto.user;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BandPositionDTO {
    private Long id;
    private String role;
    private String memberName;
    @com.fasterxml.jackson.annotation.JsonProperty("isRecruiting")
    private boolean isRecruiting;
    private Long userId;
    private String profileImageUrl;
}
