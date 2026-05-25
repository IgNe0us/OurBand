package com.ourband.api.domain.dto.user;

import lombok.Getter;
import lombok.Setter;
import java.util.List;

@Getter
@Setter
public class PollRequestDTO {
    private String title;
    private List<String> options;
    private Boolean isMultipleChoice;
}
