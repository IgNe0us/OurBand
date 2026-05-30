package com.ourband.api.domain.dto.recruitment;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MemberSeekingPostCreateRequestDTO {
    private String title;
    private String content;
    private String position;
    private String location;
    private String genreStyle;
    private String mediaUrl;
    private String mediaType;
    private String status;
}
