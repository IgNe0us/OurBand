package com.ourband.api.global.security;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.stereotype.Component;

import java.util.List;

@Slf4j
@RequiredArgsConstructor
@Component
public class StompHandler implements ChannelInterceptor {

    private final JwtUtil jwtUtil;

    @Override
    public Message<?> preSend(Message<?> message, MessageChannel channel) {
        StompHeaderAccessor accessor = MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);

        if (accessor != null && StompCommand.CONNECT.equals(accessor.getCommand())) {
            // Get token from native headers or session attributes
            String token = null;
            List<String> authorization = accessor.getNativeHeader("Authorization");
            if (authorization != null && !authorization.isEmpty()) {
                String authHeader = authorization.get(0);
                if (authHeader != null && authHeader.trim().length() > 0) {
                    token = authHeader.replace("Bearer ", "").trim();
                }
            }
            
            // Fallback to session attributes if header was empty or didn't contain a valid token
            if (token == null || token.isEmpty()) {
                token = (String) accessor.getSessionAttributes().get("access_token");
            }
            
            if (token != null && !token.isEmpty()) {
                if (!jwtUtil.validateToken(token)) {
                    log.error("Invalid JWT Token in STOMP CONNECT");
                    throw new IllegalArgumentException("Invalid Token");
                }
                
                Long userId = jwtUtil.getUserId(token);
                accessor.getSessionAttributes().put("userId", userId);
            } else {
                log.error("No access_token found in session attributes or headers for STOMP CONNECT");
                throw new IllegalArgumentException("Authentication required");
            }
        }
        return message;
    }
}
