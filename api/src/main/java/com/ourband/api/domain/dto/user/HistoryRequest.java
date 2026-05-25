package com.ourband.api.domain.dto.user;

import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
public class HistoryRequest {
    private String title;
    private String content;
    private String mediaUrl;
    private String mediaType;
}