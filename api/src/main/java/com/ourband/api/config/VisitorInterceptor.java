package com.ourband.api.config;

import com.ourband.api.domain.service.VisitorService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

@Component
@RequiredArgsConstructor
public class VisitorInterceptor implements HandlerInterceptor {

    private final VisitorService visitorService;

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) {
        // Option A: Track all hits to API
        // Option B: Track only specific paths or authenticated users
        // For simplicity, we just increment on specific frequently hit paths like /profile/me or /contents
        
        String path = request.getRequestURI();
        // Track only when they hit profile me (which means they opened the app while logged in)
        // or a major public page to avoid incrementing for every single asset/API call.
        if (path.equals("/api/v1/users/profile/me") || path.equals("/api/v1/trend/jams")) {
            // 식별자: IP 주소 (혹은 Authorization 헤더)
            String identifier = request.getHeader("X-Forwarded-For");
            if (identifier == null || identifier.isEmpty()) {
                identifier = request.getRemoteAddr();
            }
            
            visitorService.incrementVisitor(identifier);
        }

        return true;
    }
}
