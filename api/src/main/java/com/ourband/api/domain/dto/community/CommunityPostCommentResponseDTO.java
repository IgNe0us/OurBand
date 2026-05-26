package com.ourband.api.domain.dto.community;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;
import java.util.List;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CommunityPostCommentResponseDTO {
    private Long id;
    private Long postId;
    private Long userId;
    private String authorName;
    private String authorProfileImageUrl;
    private String content;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private Long parentId;
    private List<CommunityPostCommentResponseDTO> replies;
}
