package com.ourband.api.domain.dto.jam;

import lombok.*;
import java.time.LocalDateTime;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class JamPostCommentResponseDTO {
    private Long id;
    private Long jamId;
    private Long authorId;
    private String authorName;
    private String authorProfileImageUrl;
    private String content;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private Long parentId;
    private List<JamPostCommentResponseDTO> replies;
}
