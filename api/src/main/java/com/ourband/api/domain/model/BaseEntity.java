package com.ourband.api.domain.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
// 👇 이 3줄의 import가 추가되어야 에러가 사라져!
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;

/**
 * 모든 도메인 엔티티가 상속받을 공통 기본 엔티티.
 */
@MappedSuperclass
@Getter
@Setter
// 👇 이거 무조건 있어야 시간이 자동으로 들어가! (아까 빠져 있었어)
@EntityListeners(AuditingEntityListener.class) 
public abstract class BaseEntity {

    @CreatedDate
    @Column(updatable = false)
    private LocalDateTime createdAt;

    @LastModifiedDate
    private LocalDateTime updatedAt;
}