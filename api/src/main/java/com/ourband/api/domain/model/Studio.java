package com.ourband.api.domain.model;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "studio")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Studio {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long ownerId;

    @Column(length = 100)
    private String name;

    @Column(length = 255)
    private String address;

    private Double lat;
    private Double lng;

    @Column(columnDefinition = "TEXT")
    private String description;

    private String amenities;

    @Column(length = 255)
    private String bookingUrl;

    private Double rating;
    private Integer reviewCount;
}
