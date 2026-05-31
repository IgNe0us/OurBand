package com.ourband.api.domain.controller;

import com.ourband.api.domain.dto.chat.ChatMessageRequestDTO;
import com.ourband.api.domain.dto.chat.ChatMessageResponseDTO;
import com.ourband.api.domain.service.chat.ChatService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessageHeaderAccessor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

@Slf4j
@Controller
@RequiredArgsConstructor
public class ChatWebSocketController {

    private final ChatService chatService;
    private final SimpMessagingTemplate messagingTemplate;

    /**
     * 클라이언트가 /pub/chat.message.{roomId} 로 메시지를 보낼 때 호출됨.
     */
    @MessageMapping("/chat.message.{roomId}")
    public void sendMessage(
            @DestinationVariable("roomId") Long roomId,
            @Payload ChatMessageRequestDTO request,
            SimpMessageHeaderAccessor accessor) {
        
        // StompHandler에서 세션에 저장한 userId를 꺼내옴
        Long senderId = (Long) accessor.getSessionAttributes().get("userId");
        
        if (senderId == null) {
            log.error("No userId in session attributes for roomId: {}", roomId);
            return;
        }

        // 서비스 단에서 메시지를 Redis에 임시 저장하고, Pub/Sub으로 발행함 (DB 지연 쓰기)
        chatService.sendMessage(roomId, senderId, request.getContent());
    }
}
