package com.ourband.api.domain.dto.admin;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SiteSettingDTO {
    private String settingKey;
    private String settingValue;
    private String description;
}
