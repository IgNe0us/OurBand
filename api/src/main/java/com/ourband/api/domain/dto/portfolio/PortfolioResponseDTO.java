package com.ourband.api.domain.dto.portfolio;

import lombok.*;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PortfolioResponseDTO {
    private Long id;
    private Long userId;
    private String mediaUrl;
    private String title;
    private String description;
    private boolean isPublic;
    private LocalDateTime createdAt;
}
