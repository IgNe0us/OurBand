package com.ourband.api.global.config;

import com.ourband.api.config.VisitorInterceptor;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;
import lombok.RequiredArgsConstructor;

import java.nio.file.Path;
import java.nio.file.Paths;

import com.ourband.api.global.interceptor.MaintenanceModeInterceptor;

@Configuration
@RequiredArgsConstructor
public class WebConfig implements WebMvcConfigurer {

    private final VisitorInterceptor visitorInterceptor;
    private final MaintenanceModeInterceptor maintenanceModeInterceptor;

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        Path uploadDir = Paths.get("uploads");
        String uploadPath = uploadDir.toFile().getAbsolutePath();

        registry.addResourceHandler("/uploads/**")
                .addResourceLocations("file:" + uploadPath + "/");
    }

    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        // 모든 API에 적용되는 점검 모드 필터 추가
        registry.addInterceptor(maintenanceModeInterceptor)
                .addPathPatterns("/api/**");

        registry.addInterceptor(visitorInterceptor)
                .addPathPatterns("/api/v1/users/profile/me", "/api/v1/trend/jams");
    }
}
