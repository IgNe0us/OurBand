package com.ourband.api.domain.dto.admin;

import lombok.*;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminContentResponseDTO {
    private String id;
    private String board;
    private String title;
    private String author;
    private String date;
    private boolean hidden;
    private String type;
}
