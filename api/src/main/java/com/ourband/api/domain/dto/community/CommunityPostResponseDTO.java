package com.ourband.api.domain.dto.community;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;
import java.util.List;
import com.ourband.api.domain.dto.user.PollResponseDTO;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CommunityPostResponseDTO {
    private Long id;
    private Long userId;
    private String authorName;
    private String authorProfileImageUrl;
    private String boardType;
    private String category;
    private String part;
    private String title;
    private String content;
    private String mediaUrl;
    private String mediaType;
    private Integer likeCount;
    private Integer commentCount;
    private Integer viewCount;
    private Boolean isLikedByCurrentUser;
    private LocalDateTime createdAt;
    
    private List<CommunityPostCommentResponseDTO> comments;
    private PollResponseDTO poll;
}
