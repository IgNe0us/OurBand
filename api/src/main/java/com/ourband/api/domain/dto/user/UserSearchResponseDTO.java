package com.ourband.api.domain.dto.user;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class UserSearchResponseDTO {
    private Long userId;
    private String nickname;
    private String profilePictureUrl;
    private String instrument;
    private String location;
    
    @com.fasterxml.jackson.annotation.JsonProperty("isFollowing")
    private boolean isFollowing;
}
