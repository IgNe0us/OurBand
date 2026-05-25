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
public class PollResponseDTO {
    private Long id;
    private String title;
    private Boolean isMultipleChoice;
    private List<PollOptionResponseDTO> options;
    private Long totalVotes;
    private Long myVotedOptionId;
}
