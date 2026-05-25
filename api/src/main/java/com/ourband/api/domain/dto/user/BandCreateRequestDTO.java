package com.ourband.api.domain.dto.user;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class BandCreateRequestDTO {
    private String name;          // 밴드 이름
    private String location;      // 주 활동 지역
    private String genre;         // 선호 장르 및 스타일
    private String description;   // 밴드 소개
    private String logoImageUrl;  // Cloudflare 업로드 후 받은 로고 URL
}
