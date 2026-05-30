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

        // 서비스 단에서 DB에 메시지 저장 후 응답 객체 반환
        ChatMessageResponseDTO savedMessage = chatService.sendMessage(roomId, senderId, request.getContent());

        // /sub/chat.room.{roomId} 를 구독하고 있는 모든 클라이언트에게 메시지 브로드캐스트
        messagingTemplate.convertAndSend("/sub/chat.room." + roomId, savedMessage);
    }
}
