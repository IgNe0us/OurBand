package com.ourband.api.domain.dto.jam;

import lombok.*;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class JamPostResponseDTO {
    private Long id;
    private Long userId;
    private String authorName;
    private String authorProfileImageUrl;
    
    private Long portfolioId;
    
    // For duet, point to original
    private Long parentId;
    private String originalAuthorName;
    
    private String mediaUrl;
    private String title;
    private String description;
    private String instrument;
    private String genre;
    
    private int likeCount;
    private int commentCount;
    private int shareCount;
    private int viewCount;
    
    // Volume mixing
    private Double originalVolume;
    private Double myVolume;
    
    @com.fasterxml.jackson.annotation.JsonProperty("isLiked")
    private boolean isLiked;
    @com.fasterxml.jackson.annotation.JsonProperty("isFollowing")
    private boolean isFollowing;
    
    private LocalDateTime createdAt;
}
