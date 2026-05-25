package com.ourband.api.domain.dto.user;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BandPostCommentResponseDTO {
    private Long id;
    private Long postId;
    private Long authorId;
    private String authorName;
    private String authorProfileImageUrl;
    private String content;
    private LocalDateTime createdAt;
}
