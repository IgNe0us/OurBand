package com.ourband.api.domain.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

@Entity
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "users")
public class User extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Long userId;

    @Column(nullable = false, length = 100)
    private String nickname;

    @Column(nullable = false, unique = true)
    private String email;

    @Column(name = "password", nullable = false)
    private String password; // 실제 비밀번호는 해시되어 저장됨

    @Column(name = "type", length = 255)
    private String type; 

    @Column(name = "business_number", length = 1024)
    private String businessNumber;

    @Column(columnDefinition = "BOOLEAN DEFAULT TRUE")
    private Boolean isActive;
}