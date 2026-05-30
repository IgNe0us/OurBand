package com.ourband.api.domain.model;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "studio_room")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StudioRoom {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "studio_id")
    private Studio studio;

    private String name;
    private String size;
    
    @Column(columnDefinition = "TEXT")
    private String equipment;
}
