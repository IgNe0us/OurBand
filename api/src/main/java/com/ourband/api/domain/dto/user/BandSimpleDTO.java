package com.ourband.api.domain.dto.user;

import java.time.LocalDateTime;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class BandSimpleDTO {
    private Long bandId;
    private String bandName;
    private String role; // 내 역할 (예: 리드 기타, 보컬)
    private String logoImageUrl;
    private LocalDateTime createdAt;;
}