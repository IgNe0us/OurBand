package com.ourband.api.domain.dto.recruitment;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MemberSeekingPostResponseDTO {
    private Long id;
    private Long userId;
    private String authorName;
    private String authorProfileImageUrl;
    private String title;
    private String content;
    private String position;
    private String location;
    private String genreStyle;
    private String mediaUrl;
    private String mediaType;
    private String status;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
