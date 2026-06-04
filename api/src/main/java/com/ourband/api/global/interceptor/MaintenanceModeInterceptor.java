package com.ourband.api.global.interceptor;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.ourband.api.domain.service.SiteSettingsService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.servlet.HandlerInterceptor;

import java.util.HashMap;
import java.util.Map;

@Component
@RequiredArgsConstructor
public class MaintenanceModeInterceptor implements HandlerInterceptor {

    private final SiteSettingsService siteSettingsService;
    private final ObjectMapper objectMapper;

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) throws Exception {
        String requestURI = request.getRequestURI();

        // 관리자 API, Auth API, Public Settings API 등은 예외 처리
        if (requestURI.startsWith("/api/v1/admin") || 
            requestURI.startsWith("/api/v1/auth") ||
            requestURI.startsWith("/api/v1/users/login") ||
            requestURI.startsWith("/api/v1/users/register") ||
            requestURI.startsWith("/api/v1/users/me") ||
            requestURI.startsWith("/api/v1/users/refresh") ||
            requestURI.startsWith("/api/v1/users/logout") ||
            requestURI.equals("/api/v1/settings/public") ||
            requestURI.startsWith("/v3/api-docs") ||
            requestURI.startsWith("/swagger-ui")) {
            return true;
        }

        // 시스템 관리자 및 서비스 관리자는 점검 모드를 무시하고 모든 기능 사용 가능
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.isAuthenticated()) {
            boolean isAdmin = auth.getAuthorities().stream()
                    .anyMatch(a -> a.getAuthority().equals("ROLE_SYSTEM_ADMIN") || a.getAuthority().equals("ROLE_SERVICE_ADMIN"));
            if (isAdmin) {
                return true;
            }
        }

        if (siteSettingsService.isMaintenanceMode()) {
            response.setStatus(HttpServletResponse.SC_SERVICE_UNAVAILABLE); // 503
            response.setContentType("application/json");
            response.setCharacterEncoding("UTF-8");

            Map<String, String> errorResponse = new HashMap<>();
            errorResponse.put("errorCode", "MAINTENANCE");
            errorResponse.put("message", "현재 시스템 점검 중입니다. 잠시 후 다시 시도해주세요.");

            response.getWriter().write(objectMapper.writeValueAsString(errorResponse));
            return false;
        }

        return true;
    }
}
