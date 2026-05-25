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
public class BandPostResponseDTO {
    private Long id;
    private Long bandId;
    private Long authorId;
    private String authorName;
    private String authorRole; // "방장", "기타", "드럼" 등 작성자의 밴드 내 역할
    private String boardType;
    private String category;
    private String title;
    private String content;
    private String mediaUrl;
    private String mediaType;
    private String scheduleDate;
    private String scheduleDetails;
    private LocalDateTime createdAt;
    
    // 추가된 필드들
    private Integer likeCount;
    private Integer commentCount;
    private Boolean isLikedByCurrentUser;
    private String authorProfileImageUrl;
    private java.util.List<BandPostCommentResponseDTO> comments;
    private PollResponseDTO poll;
}
