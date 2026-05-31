package com.ourband.api.global.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.data.redis.connection.lettuce.LettuceConnectionFactory;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.data.redis.listener.RedisMessageListenerContainer;
import org.springframework.data.redis.serializer.Jackson2JsonRedisSerializer;
import org.springframework.data.redis.serializer.StringRedisSerializer;
import org.springframework.beans.factory.annotation.Value;

@Configuration
public class RedisConfig {

    @Bean
    public com.fasterxml.jackson.databind.ObjectMapper objectMapper() {
        com.fasterxml.jackson.databind.ObjectMapper mapper = new com.fasterxml.jackson.databind.ObjectMapper();
        // Java 8 날짜/시간(LocalDateTime 등) 처리를 위한 모듈 등록
        mapper.registerModule(new com.fasterxml.jackson.datatype.jsr310.JavaTimeModule());
        mapper.disable(com.fasterxml.jackson.databind.SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);
        return mapper;
    }

    @Bean
    public RedisMessageListenerContainer redisMessageListenerContainer(org.springframework.data.redis.connection.RedisConnectionFactory connectionFactory,
                                                                       org.springframework.data.redis.listener.adapter.MessageListenerAdapter listenerAdapter) {
        RedisMessageListenerContainer container = new RedisMessageListenerContainer();
        container.setConnectionFactory(connectionFactory);
        container.addMessageListener(listenerAdapter, new org.springframework.data.redis.listener.ChannelTopic("chat_room"));
        return container;
    }

    @Bean
    public org.springframework.data.redis.listener.adapter.MessageListenerAdapter listenerAdapter(com.ourband.api.domain.service.chat.RedisChatSubscriber subscriber) {
        return new org.springframework.data.redis.listener.adapter.MessageListenerAdapter(subscriber, "onMessage");
    }

    @Bean
    public RedisTemplate<String, Object> redisTemplate(RedisConnectionFactory connectionFactory, com.fasterxml.jackson.databind.ObjectMapper objectMapper) {
        RedisTemplate<String, Object> redisTemplate = new RedisTemplate<>();
        redisTemplate.setConnectionFactory(connectionFactory);
        
        // Key는 String 타입으로 직렬화
        redisTemplate.setKeySerializer(new StringRedisSerializer());
        
        // Value는 JSON 타입으로 직렬화 (LocalDateTime 모듈이 등록된 커스텀 objectMapper 사용)
        Jackson2JsonRedisSerializer<Object> serializer = new Jackson2JsonRedisSerializer<>(objectMapper, Object.class);
        redisTemplate.setValueSerializer(serializer);
        
        redisTemplate.setHashKeySerializer(new StringRedisSerializer());
        redisTemplate.setHashValueSerializer(serializer);
        
        return redisTemplate;
    }
}
