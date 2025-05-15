package com.ssafy.baperang.domain.menu.dto.response;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.Map;
import java.util.List;

@Getter
@NoArgsConstructor
@AllArgsConstructor
public class MenuPlanResponseDto {
    private Map<String, Map<String, MenuItemDto>> plan;

    @Getter
    @NoArgsConstructor
    @AllArgsConstructor
    public static class MenuItemDto {
        private String category;
        private List<String> alternatives;
    }
}
