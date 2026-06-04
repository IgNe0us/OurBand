package com.ourband.api.domain.dto.user;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.*;
import java.time.LocalDateTime;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BandListResponseDTO {
    private Long id;
    private String name;
    private String genre;
    private String location;
    private String description;
    private String logoImageUrl;
    private String coverImageUrl;
    private String meetingSchedule;
    private int memberCount;
    private List<RecruitingPosition> recruitingPositions;
    @JsonProperty("isRecruiting")
    private boolean isRecruiting;
    @JsonProperty("isFollowed")
    private boolean isFollowed;
    private long followerCount;
    private LocalDateTime createdAt;
    private String latestVideoUrl;
    private Long leaderId;
    private String leaderProfileImageUrl;
    private List<String> memberProfileUrls;

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class RecruitingPosition {
        private Long id;
        private String role;
    }
}
