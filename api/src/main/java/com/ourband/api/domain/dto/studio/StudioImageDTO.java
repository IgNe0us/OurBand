package com.ourband.api.domain.dto.studio;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StudioImageDTO {
    private Long id;
    private String imageUrl;
}
