package com.ourband.api.domain.service.chat;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.ourband.api.domain.dto.chat.ChatMessageResponseDTO;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.connection.Message;
import org.springframework.data.redis.connection.MessageListener;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.messaging.simp.SimpMessageSendingOperations;
import org.springframework.stereotype.Service;
import com.ourband.api.domain.repository.chat.ChatRoomMemberRepository;
import com.ourband.api.domain.model.chat.ChatRoomMember;
import java.util.List;

@Slf4j
@RequiredArgsConstructor
@Service
public class RedisChatSubscriber implements MessageListener {

    private final ObjectMapper objectMapper;
    private final RedisTemplate<String, Object> redisTemplate;
    private final SimpMessageSendingOperations messagingTemplate;
    private final ChatRoomMemberRepository chatRoomMemberRepository;

    /**
     * Redis에서 메시지가 발행(publish)되면 대기하고 있던 onMessage가 해당 메시지를 받아 처리한다.
     */
    @Override
    public void onMessage(Message message, byte[] pattern) {
        try {
            // Redis에서 발행된 데이터를 받아 역직렬화
            String publishMessage = (String) redisTemplate.getStringSerializer().deserialize(message.getBody());
            
            // ChatMessageResponseDTO 객체로 맵핑
            ChatMessageResponseDTO roomMessage = objectMapper.readValue(publishMessage, ChatMessageResponseDTO.class);
            
            log.info("Received message from Redis: {}", roomMessage.getContent());
            
            // 웹소켓 구독자에게 채팅방 채널로 메시지 전송
            messagingTemplate.convertAndSend("/sub/chat.room." + roomMessage.getRoomId(), roomMessage);
            
            // 각 사용자의 개인 채널(Global)로도 메시지 전송 (알림 뱃지용)
            String key = "chat_room_members:" + roomMessage.getRoomId();
            java.util.Set<Object> membersObj = redisTemplate.opsForSet().members(key);
            
            if (membersObj != null && !membersObj.isEmpty()) {
                for (Object memberIdObj : membersObj) {
                    messagingTemplate.convertAndSend("/sub/chat.user." + memberIdObj, roomMessage);
                }
            } else {
                List<ChatRoomMember> members = chatRoomMemberRepository.findByChatRoom_Id(roomMessage.getRoomId());
                for (ChatRoomMember member : members) {
                    redisTemplate.opsForSet().add(key, member.getUserId().toString());
                    messagingTemplate.convertAndSend("/sub/chat.user." + member.getUserId(), roomMessage);
                }
                redisTemplate.expire(key, 1, java.util.concurrent.TimeUnit.DAYS);
            }
            
        } catch (Exception e) {
            log.error("Exception in RedisChatSubscriber.onMessage: ", e);
        }
    }
}
