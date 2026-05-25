package com.ourband.api.domain.dto.user;

import lombok.Getter;
import lombok.Setter;
import java.util.List;

@Getter
@Setter
public class BandProfileUpdateRequestDTO {
    private String name;
    private String genre;
    private String location;
    private String frequency; // maps to meetingSchedule
    private String description;
    private String coverImage; // maps to coverImageUrl
    private String logoImage; // maps to logoImageUrl
    private String historyJson;
    private List<BandPositionUpdateDTO> positions;
}
