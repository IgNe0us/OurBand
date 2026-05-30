package com.ourband.api.domain.dto.studio;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StudioRoomDTO {
    private Long id;
    private String name;
    private String size;
    private String equipment;
}
