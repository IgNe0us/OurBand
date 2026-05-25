package com.ourband.api.domain.dto.user;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ProfileImageUpdateRequestDTO {
    private String imageUrl;
    private String imageType; // "PROFILE" 또는 "COVER" 로 구분
}