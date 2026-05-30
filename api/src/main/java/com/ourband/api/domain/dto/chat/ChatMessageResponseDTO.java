package com.ourband.api.domain.dto.chat;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ChatMessageResponseDTO {
    private Long messageId;
    private Long roomId;
    private Long senderId;
    private String content;
    private boolean isRead;
    private LocalDateTime createdAt;
}
