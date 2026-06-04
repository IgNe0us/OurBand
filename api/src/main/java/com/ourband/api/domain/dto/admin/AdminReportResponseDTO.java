package com.ourband.api.domain.dto.admin;

import lombok.*;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminReportResponseDTO {
    private String id;
    private String type; // "post", "comment", "jam" mapped from targetType
    private String url; // dynamically built based on targetType and targetId
    private String author; // Reporter nickname
    private String reason;
    private String date;
    private String status; // "pending", "in_progress", "resolved", "rejected"
    private String content; // The snippet of the reported content if possible, or reason
}
