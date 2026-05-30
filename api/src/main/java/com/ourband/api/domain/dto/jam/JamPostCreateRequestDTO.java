package com.ourband.api.domain.dto.jam;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class JamPostCreateRequestDTO {
    private Long portfolioId; // Optional: If imported from portfolio
    private Long parentId; // Optional: If it's a duet
    
    private String mediaUrl; // Cloudflare URL
    private String title;
    private String description;
    private String instrument;
    private String genre;
    
    private Double originalVolume;
    private Double myVolume;
}
