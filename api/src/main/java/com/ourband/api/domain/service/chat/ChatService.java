package com.ourband.api.domain.service.chat;

import com.ourband.api.domain.dto.chat.ChatMessageResponseDTO;
import com.ourband.api.domain.dto.chat.ChatRoomResponseDTO;
import com.ourband.api.domain.model.Profile;
import com.ourband.api.domain.model.User;
import com.ourband.api.domain.model.chat.ChatMessage;
import com.ourband.api.domain.model.chat.ChatRoom;
import com.ourband.api.domain.model.chat.ChatRoomMember;
import com.ourband.api.domain.repository.ProfileRepository;
import com.ourband.api.domain.repository.UserRepository;
import com.ourband.api.domain.repository.chat.ChatMessageRepository;
import com.ourband.api.domain.repository.chat.ChatRoomMemberRepository;
import com.ourband.api.domain.repository.chat.ChatRoomRepository;
import com.ourband.api.exception.UserNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ChatService {

    private final ChatRoomRepository chatRoomRepository;
    private final ChatRoomMemberRepository chatRoomMemberRepository;
    private final ChatMessageRepository chatMessageRepository;
    private final UserRepository userRepository;
    private final ProfileRepository profileRepository;
    private final org.springframework.data.redis.core.RedisTemplate<String, Object> redisTemplate;
    private final RedisChatPublisher redisChatPublisher;
    private final com.fasterxml.jackson.databind.ObjectMapper objectMapper;

    @Transactional
    public Long getOrCreateRoom(Long myUserId, Long targetUserId) {
        if (myUserId.equals(targetUserId)) {
            throw new IllegalArgumentException("Cannot create chat room with yourself");
        }

        userRepository.findById(myUserId).orElseThrow(() -> new UserNotFoundException("My User not found"));
        userRepository.findById(targetUserId).orElseThrow(() -> new UserNotFoundException("Target User not found"));

        List<ChatRoomMember> myRooms = chatRoomMemberRepository.findByUserId(myUserId);
        for (ChatRoomMember myMember : myRooms) {
            Optional<ChatRoomMember> targetMember = chatRoomMemberRepository.findByChatRoom_IdAndUserId(
                    myMember.getChatRoom().getId(), targetUserId);
            if (targetMember.isPresent()) {
                return myMember.getChatRoom().getId();
            }
        }

        ChatRoom newRoom = chatRoomRepository.save(new ChatRoom());

        chatRoomMemberRepository.save(ChatRoomMember.builder()
                .chatRoom(newRoom)
                .userId(myUserId)
                .build());

        chatRoomMemberRepository.save(ChatRoomMember.builder()
                .chatRoom(newRoom)
                .userId(targetUserId)
                .build());

        return newRoom.getId();
    }

    @Transactional(readOnly = true)
    public List<ChatRoomResponseDTO> getMyChatRooms(Long myUserId) {
        List<ChatRoomMember> myMemberships = chatRoomMemberRepository.findByUserId(myUserId);
        List<ChatRoomResponseDTO> responseList = new ArrayList<>();

        for (ChatRoomMember myMember : myMemberships) {
            Long roomId = myMember.getChatRoom().getId();
            
            // Find target user
            List<ChatRoomMember> roomMembers = chatRoomMemberRepository.findByChatRoom_Id(roomId);
            Long targetUserId = null;
            for (ChatRoomMember member : roomMembers) {
                if (!member.getUserId().equals(myUserId)) {
                    targetUserId = member.getUserId();
                    break;
                }
            }

            if (targetUserId == null) continue;

            User targetUser = userRepository.findById(targetUserId).orElse(null);
            if (targetUser == null) continue;

            Profile targetProfile = profileRepository.findByUser_UserId(targetUserId).orElse(null);
            String targetProfileUrl = (targetProfile != null) ? targetProfile.getProfilePictureUrl() : null;

            Optional<ChatMessage> lastMessageOpt = chatMessageRepository.findTopByChatRoom_IdOrderByCreatedAtDesc(roomId);
            
            int unreadCount = chatMessageRepository.countByChatRoom_IdAndIsReadFalseAndSenderIdNot(roomId, myUserId);

            // Fetch Redis messages for THIS ROOM ONLY
            List<Object> redisQueue = redisTemplate.opsForList().range("chat_message_queue:" + roomId, 0, -1);
            String lastMessage = lastMessageOpt.map(ChatMessage::getContent).orElse("");
            java.time.LocalDateTime lastMessageTime = lastMessageOpt.map(ChatMessage::getCreatedAt).orElse(null);
            
            if (redisQueue != null && !redisQueue.isEmpty()) {
                for (Object obj : redisQueue) {
                    try {
                        ChatMessageResponseDTO dto = objectMapper.readValue((String)obj, ChatMessageResponseDTO.class);
                        if (lastMessageTime == null || dto.getCreatedAt().isAfter(lastMessageTime)) {
                            lastMessage = dto.getContent();
                            lastMessageTime = dto.getCreatedAt();
                        }
                        
                        String receiptStr = (String) redisTemplate.opsForValue().get("read_receipt:" + roomId + ":" + myUserId);
                        java.time.LocalDateTime receiptTime = receiptStr != null ? java.time.LocalDateTime.parse(receiptStr) : null;
                        boolean isActuallyRead = dto.isRead() || (receiptTime != null && !dto.getCreatedAt().isAfter(receiptTime));
                        
                        if (!dto.getSenderId().equals(myUserId) && !isActuallyRead) {
                            unreadCount++;
                        }
                    } catch (Exception e) {}
                }
            }

            responseList.add(ChatRoomResponseDTO.builder()
                    .roomId(roomId)
                    .targetUserId(targetUserId)
                    .targetUserName(targetUser.getNickname())
                    .targetUserProfileUrl(targetProfileUrl)
                    .lastMessage(lastMessage)
                    .lastMessageTime(lastMessageTime)
                    .unreadCount(unreadCount)
                    .build());
        }

        // Sort by last message time
        responseList.sort((a, b) -> {
            if (a.getLastMessageTime() == null && b.getLastMessageTime() == null) return 0;
            if (a.getLastMessageTime() == null) return 1;
            if (b.getLastMessageTime() == null) return -1;
            return b.getLastMessageTime().compareTo(a.getLastMessageTime());
        });

        return responseList;
    }

    @Transactional(readOnly = true)
    public List<ChatMessageResponseDTO> getMessages(Long roomId, Long myUserId) {
        // Validate user is in room
        chatRoomMemberRepository.findByChatRoom_IdAndUserId(roomId, myUserId)
                .orElseThrow(() -> new IllegalArgumentException("User is not a member of this chat room"));

        List<ChatMessage> dbMessages = chatMessageRepository.findByChatRoom_IdOrderByCreatedAtAsc(roomId);
        List<ChatMessageResponseDTO> responseList = dbMessages.stream().map(msg -> ChatMessageResponseDTO.builder()
                .messageId(msg.getId())
                .roomId(msg.getChatRoom().getId())
                .senderId(msg.getSenderId())
                .content(msg.getContent())
                .isRead(msg.isRead())
                .createdAt(msg.getCreatedAt())
                .build()).collect(Collectors.toList());
                
        // Append messages from Redis queue
        List<Object> redisQueue = redisTemplate.opsForList().range("chat_message_queue:" + roomId, 0, -1);
        if (redisQueue != null && !redisQueue.isEmpty()) {
            for (Object obj : redisQueue) {
                try {
                    ChatMessageResponseDTO dto = objectMapper.readValue((String)obj, ChatMessageResponseDTO.class);
                    responseList.add(dto);
                } catch(Exception e) {}
            }
        }
        
        return responseList;
    }

    @Transactional
    public ChatMessageResponseDTO sendMessage(Long roomId, Long senderId, String content) {
        chatRoomMemberRepository.findByChatRoom_IdAndUserId(roomId, senderId)
                .orElseThrow(() -> new IllegalArgumentException("User is not a member of this chat room"));

        // 발급할 임시 ID (현재 시간 밀리초의 음수값). 
        // 화면에서 key 중복 방지를 위해 음수를 사용하고, DB 배치 저장 시 새 ID가 발급됩니다.
        Long tempMessageId = -redisTemplate.opsForValue().increment("chat_message_temp_seq");

        ChatMessageResponseDTO responseDTO = ChatMessageResponseDTO.builder()
                .messageId(tempMessageId)
                .roomId(roomId)
                .senderId(senderId)
                .content(content)
                .isRead(false)
                .createdAt(java.time.LocalDateTime.now())
                .build();

        try {
            // Redis List에 직렬화하여 저장 (지연 쓰기용 - 룸별 큐)
            String jsonMessage = objectMapper.writeValueAsString(responseDTO);
            redisTemplate.opsForList().rightPush("chat_message_queue:" + roomId, jsonMessage);
            redisTemplate.opsForSet().add("active_chat_rooms", roomId.toString());
            
            // Redis Pub/Sub으로 브로드캐스트
            redisChatPublisher.publish(new org.springframework.data.redis.listener.ChannelTopic("chat_room"), responseDTO);
        } catch (Exception e) {
            throw new RuntimeException("Failed to process message in Redis", e);
        }
        
        return responseDTO;
    }

    private java.util.Set<Long> getRoomMembersFromRedis(Long roomId) {
        String key = "chat_room_members:" + roomId;
        java.util.Set<Object> membersObj = redisTemplate.opsForSet().members(key);
        if (membersObj != null && !membersObj.isEmpty()) {
            return membersObj.stream().map(obj -> Long.parseLong(obj.toString())).collect(Collectors.toSet());
        }
        List<ChatRoomMember> members = chatRoomMemberRepository.findByChatRoom_Id(roomId);
        java.util.Set<Long> memberIds = members.stream().map(ChatRoomMember::getUserId).collect(Collectors.toSet());
        if (!memberIds.isEmpty()) {
            for (Long id : memberIds) {
                redisTemplate.opsForSet().add(key, id.toString());
            }
            redisTemplate.expire(key, 1, java.util.concurrent.TimeUnit.DAYS);
        }
        return memberIds;
    }

    @org.springframework.scheduling.annotation.Scheduled(fixedRate = 10000)
    @Transactional
    public void syncMessagesToDB() {
        java.util.Set<Object> activeRoomsObj = redisTemplate.opsForSet().members("active_chat_rooms");
        if (activeRoomsObj == null || activeRoomsObj.isEmpty()) return;

        List<ChatMessage> messagesToSave = new ArrayList<>();
        
        for (Object roomIdObj : activeRoomsObj) {
            String roomIdStr = roomIdObj.toString();
            Long roomId = Long.parseLong(roomIdStr);
            String queueKey = "chat_message_queue:" + roomId;
            
            Long size = redisTemplate.opsForList().size(queueKey);
            if (size == null || size == 0) {
                redisTemplate.opsForSet().remove("active_chat_rooms", roomIdStr);
                continue;
            }
            
            // Bulk pop messages for this room
            List<Object> messages = redisTemplate.opsForList().range(queueKey, 0, size - 1);
            redisTemplate.opsForList().trim(queueKey, size, -1);
            
            // Use getReferenceById to avoid SELECT query
            ChatRoom roomRef = chatRoomRepository.getReferenceById(roomId);
            java.util.Set<Long> members = getRoomMembersFromRedis(roomId);
            
            for (Object msgObj : messages) {
                try {
                    ChatMessageResponseDTO dto = objectMapper.readValue((String)msgObj, ChatMessageResponseDTO.class);
                    
                    boolean isActuallyRead = dto.isRead();
                    if (!isActuallyRead) {
                        for (Long mId : members) {
                            if (!mId.equals(dto.getSenderId())) {
                                String receiptStr = (String) redisTemplate.opsForValue().get("read_receipt:" + dto.getRoomId() + ":" + mId);
                                if (receiptStr != null) {
                                    java.time.LocalDateTime receiptTime = java.time.LocalDateTime.parse(receiptStr);
                                    if (!dto.getCreatedAt().isAfter(receiptTime)) {
                                        isActuallyRead = true;
                                    }
                                }
                            }
                        }
                    }
                    
                    ChatMessage message = ChatMessage.builder()
                            .chatRoom(roomRef)
                            .senderId(dto.getSenderId())
                            .content(dto.getContent())
                            .isRead(isActuallyRead)
                            .build();
                    messagesToSave.add(message);
                } catch (Exception e) {
                    System.err.println("Failed to parse chat message from Redis queue: " + e.getMessage());
                }
            }
            redisTemplate.opsForSet().remove("active_chat_rooms", roomIdStr);
        }

        if (!messagesToSave.isEmpty()) {
            chatMessageRepository.saveAll(messagesToSave);
            System.out.println("Batch inserted " + messagesToSave.size() + " messages to DB.");
        }
    }

    @Transactional
    public void markAsRead(Long roomId, Long myUserId) {
        chatRoomMemberRepository.findByChatRoom_IdAndUserId(roomId, myUserId)
                .orElseThrow(() -> new IllegalArgumentException("User is not a member of this chat room"));

        // Use Bulk Update to avoid SnapshotIsolationException during concurrent identical calls
        chatMessageRepository.markMessagesAsRead(roomId, myUserId);
        
        // Also set a read receipt in Redis to handle write-behind queue messages
        redisTemplate.opsForValue().set("read_receipt:" + roomId + ":" + myUserId, java.time.LocalDateTime.now().toString(), 30, java.util.concurrent.TimeUnit.SECONDS);
    }
}
