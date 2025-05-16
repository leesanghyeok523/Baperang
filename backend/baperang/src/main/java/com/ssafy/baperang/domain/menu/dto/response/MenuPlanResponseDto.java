package com.ssafy.baperang.domain.menu.dto.response;

import java.util.List;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MenuPlanResponseDto {
    private List<DayMenu> dayMenus;

    @Getter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class DayMenu {
        private String date;
        private List<MenuInfo> menus;
    }

    @Getter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class MenuInfo {
        private String menuName;
        private List<String> alternatives; // 대체 가능 메뉴 목록
    }
}
