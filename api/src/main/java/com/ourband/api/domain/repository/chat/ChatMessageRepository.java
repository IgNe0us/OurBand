package com.ourband.api.domain.repository.chat;

import com.ourband.api.domain.model.chat.ChatMessage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ChatMessageRepository extends JpaRepository<ChatMessage, Long> {
    List<ChatMessage> findByChatRoom_IdOrderByCreatedAtAsc(Long roomId);
    Optional<ChatMessage> findTopByChatRoom_IdOrderByCreatedAtDesc(Long roomId);
    
    // 유용할 수 있는 쿼리
    int countByChatRoom_IdAndIsReadFalseAndSenderIdNot(Long roomId, Long senderId);
}
