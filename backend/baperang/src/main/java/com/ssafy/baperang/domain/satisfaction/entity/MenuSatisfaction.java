package com.ssafy.baperang.domain.satisfaction.entity;

import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MenuSatisfaction {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long menuId;
    
    private String menuName;
    
    private int votes;
    
    private double satisfactionRate;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "satisfaction_id")
    private Satisfaction satisfaction;

    public void setSatisfaction(Satisfaction satisfaction) {
        this.satisfaction = satisfaction;
    }
} 