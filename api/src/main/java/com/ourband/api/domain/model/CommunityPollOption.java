package com.ourband.api.domain.model;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "community_poll_options")
@Getter
@Setter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder
public class CommunityPollOption {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "poll_id", nullable = false)
    private Long pollId;

    @Column(nullable = false, length = 255)
    private String content;

    @Column(name = "sort_order", nullable = false)
    private Integer sortOrder;
}
