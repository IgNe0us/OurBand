package com.ourband.api.domain.service.chat;

import com.ourband.api.domain.dto.chat.ChatMessageResponseDTO;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.data.redis.listener.ChannelTopic;
import org.springframework.stereotype.Service;

@Slf4j
@RequiredArgsConstructor
@Service
public class RedisChatPublisher {

    private final RedisTemplate<String, Object> redisTemplate;

    public void publish(ChannelTopic topic, ChatMessageResponseDTO message) {
        log.info("Publishing message to Redis Topic: {}", topic.getTopic());
        redisTemplate.convertAndSend(topic.getTopic(), message);
    }
}
