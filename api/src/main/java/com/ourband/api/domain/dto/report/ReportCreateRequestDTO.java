package com.ourband.api.domain.dto.report;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ReportCreateRequestDTO {
    // 예: COMMUNITY_POST, BAND_POST, JAM_POST, HISTORY_POST, COMMUNITY_COMMENT, BAND_COMMENT, JAM_COMMENT, HISTORY_COMMENT
    private String targetType; 
    private Long targetId;
    private String reason;
}
