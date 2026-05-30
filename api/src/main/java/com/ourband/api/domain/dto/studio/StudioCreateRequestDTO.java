package com.ourband.api.domain.dto.studio;

import lombok.*;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StudioCreateRequestDTO {
    private String name;
    private String address;
    private Double lat;
    private Double lng;
    private String description;
    private String amenities;
    private String bookingUrl;
    private List<StudioRoomDTO> rooms;
    private List<String> imageUrls;
}
