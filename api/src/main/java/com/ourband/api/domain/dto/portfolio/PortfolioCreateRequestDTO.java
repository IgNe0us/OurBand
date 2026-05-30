package com.ourband.api.domain.dto.portfolio;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PortfolioCreateRequestDTO {
    private String mediaUrl;
    private String title;
    private String description;
    private boolean isPublic;
}
