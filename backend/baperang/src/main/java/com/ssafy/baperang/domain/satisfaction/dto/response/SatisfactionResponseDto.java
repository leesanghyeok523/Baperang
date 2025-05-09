package com.ssafy.baperang.domain.satisfaction.dto.response;

import java.util.List;

import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SatisfactionResponseDto {
    private List<MenuSatisfactionDto> allMenuSatisfactions;
    
    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class MenuSatisfactionDto {
        private Long menuId;
        private String menuName;
        private String averageSatisfaction;
    }
} 