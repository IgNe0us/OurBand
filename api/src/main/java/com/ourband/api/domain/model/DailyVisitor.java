package com.ourband.api.domain.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;

@Entity
@Table(name = "daily_visitors")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DailyVisitor {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private LocalDate visitDate;

    @Column(nullable = false)
    private int dau; // 일간 활성 사용자

    @Column(nullable = false)
    private int mau; // 월간 누적 활성 사용자
}
