package com.ourband.api.domain.dto.community;

import lombok.Getter;
import lombok.Setter;
import com.ourband.api.domain.dto.user.PollRequestDTO;

@Getter
@Setter
public class CommunityPostCreateRequestDTO {
    private String boardType; // "FREE", "COUNSELING", "FLEX"
    private String category;
    private String part;
    private String title;
    private String content;
    private String mediaUrl;
    private String mediaType;
    private PollRequestDTO poll;
}
