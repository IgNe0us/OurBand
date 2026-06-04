package com.ourband.api.domain.service;

import com.ourband.api.domain.dto.user.NotificationResponseDTO;
import com.ourband.api.domain.model.Notification;
import com.ourband.api.domain.model.NotificationType;
import com.ourband.api.domain.model.Profile;
import com.ourband.api.domain.model.User;
import com.ourband.api.domain.repository.NotificationRepository;
import com.ourband.api.domain.repository.ProfileRepository;
import com.ourband.api.domain.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;
    private final ProfileRepository profileRepository;

    // 사용자 ID를 키로 하여 SseEmitter 관리
    private final Map<Long, SseEmitter> emitters = new ConcurrentHashMap<>();

    private static final Long DEFAULT_TIMEOUT = 60L * 1000 * 60; // 1시간

    public SseEmitter subscribe(Long userId) {
        SseEmitter emitter = new SseEmitter(DEFAULT_TIMEOUT);
        emitters.put(userId, emitter);

        emitter.onCompletion(() -> emitters.remove(userId));
        emitter.onTimeout(() -> emitters.remove(userId));
        emitter.onError((e) -> emitters.remove(userId));

        // 503 에러 방지를 위한 더미 데이터 전송
        try {
            emitter.send(SseEmitter.event().name("connect").data("Connected!"));
        } catch (IOException e) {
            emitters.remove(userId);
        }

        return emitter;
    }

    @org.springframework.scheduling.annotation.Scheduled(fixedRate = 45000)
    public void sendHeartbeat() {
        emitters.forEach((userId, emitter) -> {
            try {
                // 더미 데이터(ping)를 보내서 연결 유지 (Nginx 504 Timeout 방지)
                emitter.send(SseEmitter.event().name("ping").data("keep-alive"));
            } catch (IOException e) {
                emitters.remove(userId);
            }
        });
    }

    @Transactional
    public void send(Long receiverId, Long senderId, NotificationType type, String targetId, String content) {
        // 테스트 편의상 자기 자신에게도 알림이 가도록 허용 (운영 환경에서는 복구)
        // if (receiverId.equals(senderId)) {
        //     return;
        // }

        Notification notification = Notification.builder()
                .receiverId(receiverId)
                .senderId(senderId)
                .type(type)
                .targetId(targetId)
                .content(content)
                .build();
        
        Notification savedNotification = notificationRepository.save(notification);

        // SSE로 실시간 전송
        if (emitters.containsKey(receiverId)) {
            SseEmitter emitter = emitters.get(receiverId);
            try {
                emitter.send(SseEmitter.event()
                        .name("notification")
                        .data(mapToDTO(savedNotification)));
            } catch (IOException e) {
                emitters.remove(receiverId);
            }
        }
    }

    @Transactional(readOnly = true)
    public List<NotificationResponseDTO> getNotifications(Long userId) {
        return notificationRepository.findByReceiverIdOrderByCreatedAtDesc(userId).stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public int getUnreadCount(Long userId) {
        return notificationRepository.countByReceiverIdAndIsReadFalse(userId);
    }

    @Transactional
    public void markAsRead(Long notificationId, Long userId) {
        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new IllegalArgumentException("알림을 찾을 수 없습니다."));
        
        if (!notification.getReceiverId().equals(userId)) {
            throw new IllegalArgumentException("권한이 없습니다.");
        }
        
        notification.setRead(true);
    }

    private NotificationResponseDTO mapToDTO(Notification notification) {
        String senderName = null;
        String senderProfileImageUrl = null;

        if (notification.getSenderId() != null) {
            User sender = userRepository.findById(notification.getSenderId()).orElse(null);
            if (sender != null) {
                senderName = sender.getNickname();
                Profile profile = profileRepository.findByUser_UserId(sender.getUserId()).orElse(null);
                if (profile != null) {
                    senderProfileImageUrl = profile.getProfilePictureUrl();
                }
            }
        }

        return NotificationResponseDTO.builder()
                .id(notification.getId())
                .senderId(notification.getSenderId())
                .senderName(senderName)
                .senderProfileImageUrl(senderProfileImageUrl)
                .type(notification.getType())
                .targetId(notification.getTargetId())
                .content(notification.getContent())
                .isRead(notification.isRead())
                .createdAt(notification.getCreatedAt())
                .build();
    }
}
