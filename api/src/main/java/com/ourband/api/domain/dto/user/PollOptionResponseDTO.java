package com.ourband.api.domain.dto.user;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PollOptionResponseDTO {
    private Long id;
    private String content;
    private Long voteCount;
}
