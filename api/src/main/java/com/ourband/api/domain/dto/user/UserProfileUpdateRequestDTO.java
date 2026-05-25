package com.ourband.api.domain.dto.user;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class UserProfileUpdateRequestDTO {
    private String location;    // 활동 구역 (예: 합정역 근처 (마포구))
    private String instrument;  // 주 포지션 (예: 기타)
    private String bio;         // 한줄 소개
    private String profilePictureUrl; // 프로필사진
    private String profileBackgroundPictureUrl; // 프로필백그라운드사진
}