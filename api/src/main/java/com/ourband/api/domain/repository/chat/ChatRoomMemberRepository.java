package com.ourband.api.domain.repository.chat;

import com.ourband.api.domain.model.chat.ChatRoomMember;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ChatRoomMemberRepository extends JpaRepository<ChatRoomMember, Long> {
    List<ChatRoomMember> findByUserId(Long userId);
    List<ChatRoomMember> findByChatRoom_Id(Long roomId);
    Optional<ChatRoomMember> findByChatRoom_IdAndUserId(Long roomId, Long userId);
}
