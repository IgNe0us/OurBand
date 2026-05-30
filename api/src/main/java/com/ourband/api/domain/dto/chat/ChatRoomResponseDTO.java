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
public class ChatRoomResponseDTO {
    private Long roomId;
    private Long targetUserId;
    private String targetUserName;
    private String targetUserProfileUrl;
    private String lastMessage;
    private LocalDateTime lastMessageTime;
    private int unreadCount;
}
