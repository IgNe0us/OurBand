package com.ourband.api.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;

/**
 * JPA Auditing 기능을 활성화하는 설정 클래스.
 * @EnableJpaAuditing을 통해 BaseEntity의 createdAt/updatedAt 필드 자동 관리를 활성화합니다.
 */
@Configuration
@EnableJpaAuditing
public class JpaAuditingConfig {}