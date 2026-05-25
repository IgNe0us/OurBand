package com.ourband.api.domain.dto.user;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class BandPostCreateRequestDTO {
    private String boardType; // "NOTICE", "FREE", "SCHEDULE", "REHEARSAL"
    private String category; // 말머리 (예: 일반, 잡담, 질문, 정보, 장비 등)
    private String title;
    private String content;
    private String mediaUrl;
    private String mediaType;
    private String scheduleDate;
    private String scheduleDetails;
    private PollRequestDTO poll;
}
