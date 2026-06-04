package com.ourband.api.domain.dto.studio;

import lombok.*;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StudioListResponseDTO {
    private Long id;
    private String name;
    private String address;
    private Double lat;
    private Double lng;
    private String amenities;
    private Double rating;
    private Integer reviewCount;
    private Double distKm;
    private List<StudioImageDTO> images;
}
