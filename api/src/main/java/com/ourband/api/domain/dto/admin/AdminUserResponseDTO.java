package com.ourband.api.domain.dto.admin;

import lombok.*;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminUserResponseDTO {
    private String id;
    private String username;
    private String email;
    private String joined;
    private String status;
    private int reports;
    private String role;
    private String suspendedUntil;
    private String suspendReason;
}
