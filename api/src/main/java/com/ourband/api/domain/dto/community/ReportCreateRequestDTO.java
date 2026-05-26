package com.ourband.api.domain.dto.community;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ReportCreateRequestDTO {
    private String targetType; // "POST", "COMMENT"
    private Long targetId;
    private String reason;
}
