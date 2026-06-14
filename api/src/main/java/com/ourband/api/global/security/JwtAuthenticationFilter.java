package com.ourband.api.global.security;

import com.ourband.api.domain.model.User;
import com.ourband.api.domain.repository.UserRepository;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;

@Component
@RequiredArgsConstructor
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtUtil jwtUtil;
    private final UserRepository userRepository;

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain
    ) throws ServletException, IOException {

        String token = null;

        // 1. 쿠키에서 access_token 찾기
        if (request.getCookies() != null) {
            for (Cookie cookie : request.getCookies()) {
                if ("access_token".equals(cookie.getName())) {
                    token = cookie.getValue();
                }
            }
        }

        // 1-1. 쿠키에 없으면 쿼리 파라미터에서 찾기 (SSE 통신 등 우회 목적)
        if (token == null && request.getParameter("token") != null) {
            token = request.getParameter("token");
        }

        // 2. 토큰 존재 + 유효성 검사
        if (token != null) {
            System.out.println("[JwtAuthFilter] Token found in cookies: " + token);
            if (jwtUtil.validateToken(token)) {
                Long userId = jwtUtil.getUserId(token);
                User user = userRepository.findById(userId).orElse(null);
                
                System.out.println("[JwtAuthFilter] Token is valid. UserId: " + userId + ", User found: " + (user != null));

                if (user != null) {
                    if (Boolean.FALSE.equals(user.getIsActive())) {
                        System.out.println("[JwtAuthFilter] User is banned! Denying access.");
                    } else {
                        // 권한 매핑 로직
                    String role = "ROLE_USER";
                    if ("system_admin".equals(user.getType()) || "admin".equals(user.getType())) {
                        role = "ROLE_SYSTEM_ADMIN";
                    } else if ("service_admin".equals(user.getType())) {
                        role = "ROLE_SERVICE_ADMIN";
                    }

                    UsernamePasswordAuthenticationToken authentication =
                            new UsernamePasswordAuthenticationToken(
                                    user,
                                    null,
                                    List.of(new SimpleGrantedAuthority(role))
                            );

                        // 💡 여기가 핵심
                        SecurityContextHolder.getContext()
                                .setAuthentication(authentication);
                        System.out.println("[JwtAuthFilter] Successfully authenticated user: " + user.getEmail());
                    }
                } else {
                    System.out.println("[JwtAuthFilter] User not found in database!");
                }
            } else {
                System.out.println("[JwtAuthFilter] Token is invalid or expired!");
            }
        } else {
            // Optional: System.out.println("[JwtAuthFilter] No access_token cookie found in request to " + request.getRequestURI());
        }

        filterChain.doFilter(request, response);
    }
}