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

            responseList.add(ChatRoomResponseDTO.builder()
                    .roomId(roomId)
                    .targetUserId(targetUserId)
                    .targetUserName(targetUser.getNickname())
                    .targetUserProfileUrl(targetProfileUrl)
                    .lastMessage(lastMessageOpt.map(ChatMessage::getContent).orElse(""))
                    .lastMessageTime(lastMessageOpt.map(ChatMessage::getCreatedAt).orElse(null))
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

        List<ChatMessage> messages = chatMessageRepository.findByChatRoom_IdOrderByCreatedAtAsc(roomId);
        return messages.stream().map(msg -> ChatMessageResponseDTO.builder()
                .messageId(msg.getId())
                .roomId(msg.getChatRoom().getId())
                .senderId(msg.getSenderId())
                .content(msg.getContent())
                .isRead(msg.isRead())
                .createdAt(msg.getCreatedAt())
                .build()).collect(Collectors.toList());
    }

    @Transactional
    public ChatMessageResponseDTO sendMessage(Long roomId, Long senderId, String content) {
        chatRoomMemberRepository.findByChatRoom_IdAndUserId(roomId, senderId)
                .orElseThrow(() -> new IllegalArgumentException("User is not a member of this chat room"));

        ChatRoom room = chatRoomRepository.findById(roomId)
                .orElseThrow(() -> new IllegalArgumentException("Chat room not found"));

        ChatMessage message = ChatMessage.builder()
                .chatRoom(room)
                .senderId(senderId)
                .content(content)
                .isRead(false)
                .build();

        ChatMessage savedMessage = chatMessageRepository.save(message);
        
        return ChatMessageResponseDTO.builder()
                .messageId(savedMessage.getId())
                .roomId(savedMessage.getChatRoom().getId())
                .senderId(savedMessage.getSenderId())
                .content(savedMessage.getContent())
                .isRead(savedMessage.isRead())
                .createdAt(savedMessage.getCreatedAt())
                .build();
    }

    @Transactional
    public void markAsRead(Long roomId, Long myUserId) {
        chatRoomMemberRepository.findByChatRoom_IdAndUserId(roomId, myUserId)
                .orElseThrow(() -> new IllegalArgumentException("User is not a member of this chat room"));

        List<ChatMessage> messages = chatMessageRepository.findByChatRoom_IdOrderByCreatedAtAsc(roomId);
        for (ChatMessage msg : messages) {
            if (!msg.getSenderId().equals(myUserId) && !msg.isRead()) {
                msg.setRead(true);
            }
        }
        // Spring Data JPA will automatically detect changes due to @Transactional
    }
}
