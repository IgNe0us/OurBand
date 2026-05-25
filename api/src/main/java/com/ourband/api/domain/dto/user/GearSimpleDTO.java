package com.ourband.api.domain.dto.user;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class GearSimpleDTO {
    private Long id;
    private String gearName;  // 장비 모델명 (예: Fender Stratocaster)
}