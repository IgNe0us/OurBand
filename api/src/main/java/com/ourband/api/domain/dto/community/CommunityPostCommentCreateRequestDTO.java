package com.ourband.api.domain.dto.community;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class CommunityPostCommentCreateRequestDTO {
    private String content;
    private Long parentId;
}
