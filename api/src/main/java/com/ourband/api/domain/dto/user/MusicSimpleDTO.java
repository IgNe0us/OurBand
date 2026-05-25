package com.ourband.api.domain.dto.user;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class MusicSimpleDTO {
    private Long id;
    private String title;  // 곡 제목 (예: Don't Look Back In Anger)
}