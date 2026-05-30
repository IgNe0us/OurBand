package com.ourband.api.domain.model;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "studio_image")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StudioImage {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "studio_id")
    private Studio studio;

    @Column(columnDefinition = "LONGTEXT")
    private String imageUrl;
}
