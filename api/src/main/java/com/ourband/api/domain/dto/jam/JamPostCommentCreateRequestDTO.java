package com.ourband.api.domain.dto.jam;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class JamPostCommentCreateRequestDTO {
    private String content;
    private Long parentId;
}
