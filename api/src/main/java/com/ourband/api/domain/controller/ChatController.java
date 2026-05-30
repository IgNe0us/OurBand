package com.ourband.api.domain.controller;

import com.ourband.api.domain.dto.chat.ChatMessageRequestDTO;
import com.ourband.api.domain.dto.chat.ChatMessageResponseDTO;
import com.ourband.api.domain.dto.chat.ChatRoomResponseDTO;
import com.ourband.api.domain.service.chat.ChatService;
import com.ourband.api.global.security.JwtUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/chat/rooms")
@RequiredArgsConstructor
public class ChatController {

    private final ChatService chatService;
    private final JwtUtil jwtUtil;

    @GetMapping
    public ResponseEntity<List<ChatRoomResponseDTO>> getMyRooms(
            @CookieValue("access_token") String accessToken) {
        Long myUserId = jwtUtil.getUserId(accessToken);
        List<ChatRoomResponseDTO> rooms = chatService.getMyChatRooms(myUserId);
        return ResponseEntity.ok(rooms);
    }

    @PostMapping
    public ResponseEntity<Long> createOrGetRoom(
            @CookieValue("access_token") String accessToken,
            @RequestParam("targetUserId") Long targetUserId) {
        Long myUserId = jwtUtil.getUserId(accessToken);
        Long roomId = chatService.getOrCreateRoom(myUserId, targetUserId);
        return ResponseEntity.ok(roomId);
    }

    @GetMapping("/{roomId}/messages")
    public ResponseEntity<List<ChatMessageResponseDTO>> getMessages(
            @CookieValue("access_token") String accessToken,
            @PathVariable("roomId") Long roomId) {
        Long myUserId = jwtUtil.getUserId(accessToken);
        List<ChatMessageResponseDTO> messages = chatService.getMessages(roomId, myUserId);
        return ResponseEntity.ok(messages);
    }

    @PostMapping("/{roomId}/messages")
    public ResponseEntity<ChatMessageResponseDTO> sendMessage(
            @CookieValue("access_token") String accessToken,
            @PathVariable("roomId") Long roomId,
            @RequestBody ChatMessageRequestDTO request) {
        Long myUserId = jwtUtil.getUserId(accessToken);
        ChatMessageResponseDTO response = chatService.sendMessage(roomId, myUserId, request.getContent());
        return ResponseEntity.ok(response);
    }

    @PatchMapping("/{roomId}/read")
    public ResponseEntity<?> markAsRead(
            @CookieValue("access_token") String accessToken,
            @PathVariable("roomId") Long roomId) {
        try {
            Long myUserId = jwtUtil.getUserId(accessToken);
            chatService.markAsRead(roomId, myUserId);
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body("Error: " + e.getMessage() + " | Cause: " + e.getCause());
        }
    }
}
