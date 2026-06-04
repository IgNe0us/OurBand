package com.ourband.api.domain.dto.admin;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DailyVisitorResponseDTO {
    private String name; // e.g., 'Mon'
    private int dau;
    private int mau;
}
