package com.ourband.api.domain.dto.studio;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class EmergencySessionRequestDTO {
    private String position;
    private String location;
    private String detailAddress;
    private String datetime;
}
