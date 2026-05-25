package com.ourband.api.domain.dto.user;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class BandPositionUpdateDTO {
    private Long id; // null if new recruiting position
    private String role;
    private String memberName;
    @com.fasterxml.jackson.annotation.JsonProperty("isRecruiting")
    private boolean isRecruiting;
}
