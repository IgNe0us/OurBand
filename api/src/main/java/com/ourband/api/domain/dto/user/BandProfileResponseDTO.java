package com.ourband.api.domain.dto.user;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import java.util.List;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BandProfileResponseDTO {
    private Long id;
    private String name;
    private String genre;
    private String location;
    private String frequency; // maps to meetingSchedule
    private String description;
    private String coverImage; // maps to coverImageUrl
    private String logoImage; // maps to logoImageUrl
    private String historyJson; // raw history JSON
    private List<BandPositionDTO> positions;
    @com.fasterxml.jackson.annotation.JsonProperty("isLeader")
    private boolean isLeader; // whether the requesting user is the leader of this band
}
