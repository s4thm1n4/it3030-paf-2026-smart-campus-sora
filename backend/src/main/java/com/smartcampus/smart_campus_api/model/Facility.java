package com.smartcampus.smart_campus_api.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

/**
 * MODULE A — Facilities & Assets Catalogue
 * Represents a bookable campus resource (lecture hall, lab, room, equipment).
 *
 * @author Member 1 (M1)
 */
@Entity
@Table(name = "facilities")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class Facility {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank(message = "Name is required")
    @Column(nullable = false)
    private String name;

    @NotNull(message = "Type is required")
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private FacilityType type;

    private String description;

    @NotBlank(message = "Location is required")
    @Column(nullable = false)
    private String location;

    @Min(value = 1, message = "Capacity must be at least 1")
    private int capacity;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private FacilityStatus status = FacilityStatus.ACTIVE;

    private String imageUrl;

    @CreationTimestamp
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;
}
