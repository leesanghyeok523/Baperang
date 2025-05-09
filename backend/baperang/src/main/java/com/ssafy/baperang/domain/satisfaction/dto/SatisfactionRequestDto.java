package com.ssafy.baperang.domain.satisfaction.dto;

import java.time.LocalDate;
import java.util.List;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
@AllArgsConstructor
public class SatisfactionRequestDto {
    private LocalDate date;
    private List<MenuSatisfactionDto> data;
    private int totalVotes;

    @Getter
    @NoArgsConstructor
    @AllArgsConstructor
    public static class MenuSatisfactionDto {
        private Long menuId;
        private String name;
        private int votes;
        private double averageSatisfaction;
    }
} 