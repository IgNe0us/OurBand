package com.ourband.api.domain.dto.user;

import com.ourband.api.domain.model.NotificationType;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
public class NotificationResponseDTO {
    private Long id;
    private Long senderId;
    private String senderName;
    private String senderProfileImageUrl;
    private NotificationType type;
    private String targetId;
    private String content;
    @com.fasterxml.jackson.annotation.JsonProperty("isRead")
    private boolean isRead;
    private LocalDateTime createdAt;
}
