package com.ssafy.baperang.domain.satisfaction.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Satisfaction {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private LocalDate date;
    
    private LocalDateTime createdAt;
    
    private int totalVotes;

    @OneToMany(mappedBy = "satisfaction", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<MenuSatisfaction> menuSatisfactions = new ArrayList<>();

    @PrePersist
    public void prePersist() {
        this.createdAt = LocalDateTime.now();
    }

    public void addMenuSatisfaction(MenuSatisfaction menuSatisfaction) {
        this.menuSatisfactions.add(menuSatisfaction);
        menuSatisfaction.setSatisfaction(this);
    }
} 