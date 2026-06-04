package com.ourband.api.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import lombok.RequiredArgsConstructor;

import com.ourband.api.global.security.JwtAuthenticationFilter;

import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

import java.util.Arrays;
import java.util.List;

@Configuration
@EnableWebSecurity
@RequiredArgsConstructor
public class SecurityConfig {
    private final JwtAuthenticationFilter jwtAuthenticationFilter;

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {

        http
            // 1. CORS 설정을 필터 체인 최상단에 배치
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))
            // 2. CSRF는 무조건 꺼야 POST가 먹힘
            .csrf(AbstractHttpConfigurer::disable)
            // 3. 폼 로그인, HTTP 기본 인증 등 불필요한 기능 끄기
            .formLogin(AbstractHttpConfigurer::disable)
            .httpBasic(AbstractHttpConfigurer::disable)
            // 4. 경로 허용 설정
            // .authorizeHttpRequests(auth -> auth
            //     // 💡 /** 를 써서 일단 모든 경로를 열어보고 테스트하는 것도 방법이야
            //     .requestMatchers("/api/v1/users/register", "/api/v1/users/login").permitAll()
            //     .anyRequest().authenticated()
            // );
            .authorizeHttpRequests(auth -> auth
                .requestMatchers(org.springframework.http.HttpMethod.OPTIONS, "/**").permitAll()
                .requestMatchers(
                    "/api/v1/users/login",
                    "/api/v1/users/register",
                    "/api/v1/users/find-id",
                    "/api/v1/users/find-password",
                    "/api/v1/users/send-auth-code",
                    "/api/v1/users/verify-auth-code",
                    "/api/v1/users/check-nickname",
                    "/api/v1/users/find-id-send-email",
                    "/api/v1/users/reset-password",
                    "/api/v1/settings/public",
                    "/api/v1/public/**",
                    "/api/v1/uploads",
                    "/uploads/**",
                    "/ws-chat/**",
                    "/error"
                ).permitAll()
                // RBAC for Admin routes
                .requestMatchers(org.springframework.http.HttpMethod.PUT, "/api/v1/admin/users/*/role").hasRole("SYSTEM_ADMIN")
                .requestMatchers("/api/v1/admin/settings/**").hasRole("SYSTEM_ADMIN")
                .requestMatchers("/api/v1/admin/**").hasAnyRole("SYSTEM_ADMIN", "SERVICE_ADMIN")
                .anyRequest().authenticated()
            )

            .addFilterBefore(
                jwtAuthenticationFilter,
                UsernamePasswordAuthenticationFilter.class
            );

        return http.build();
    }
    // @Bean
    // public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
    //     http
    //         .cors(cors -> cors.configurationSource(corsConfigurationSource()))
    //         .csrf(csrf -> csrf.disable())
    //         .authorizeHttpRequests(auth -> auth
    //             .anyRequest().permitAll() // 💡 일단 모든 문을 다 열어버려!
    //         );
    //     return http.build();
    // }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();
        
        // 💡 모든 로컬 주소를 다 넣어버리자!
        config.setAllowedOriginPatterns(List.of(
            "http://localhost:3000",
            "http://127.0.0.1:3000",
            "http://152.69.227.244:3000",
            "http://152.69.227.244",
            "https://ourband.o-r.kr",
            "http://ourband.o-r.kr"
        ));
        
        config.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        config.setAllowedHeaders(Arrays.asList("*"));
        config.setAllowCredentials(true);
        config.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
    }
}