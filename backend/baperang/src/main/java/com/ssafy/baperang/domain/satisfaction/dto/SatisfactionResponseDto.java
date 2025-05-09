package com.ssafy.baperang.domain.satisfaction.dto;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SatisfactionResponseDto {
    private Long id;
    private LocalDate date;
    private LocalDateTime createdAt;
    private List<MenuSatisfactionResponseDto> menuSatisfactions;
    private int totalVotes;

    @Getter
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class MenuSatisfactionResponseDto {
        private Long menuId;
        private String name;
        private int votes;
        private double satisfactionRate;
    }
} 