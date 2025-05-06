package com.ssafy.baperang.domain.menu.service;

import com.ssafy.baperang.domain.menu.dto.request.MenuRequestDto;
import com.ssafy.baperang.domain.menu.dto.response.ErrorResponseDto;
import com.ssafy.baperang.domain.menu.dto.response.MenuResponseDto;
import com.ssafy.baperang.domain.menu.entity.Menu;
import com.ssafy.baperang.domain.menu.repository.MenuRepository;
import com.ssafy.baperang.domain.school.entity.School;
import com.ssafy.baperang.domain.user.entity.User;
import com.ssafy.baperang.domain.user.repository.UserRepository;
import com.ssafy.baperang.global.exception.BaperangErrorCode;
import com.ssafy.baperang.global.jwt.JwtService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.YearMonth;
import java.time.format.DateTimeFormatter;
import java.time.format.TextStyle;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class MenuServiceImpl implements MenuService {
    private final MenuRepository menuRepository;
    private final UserRepository userRepository;
    private final JwtService jwtService;

    @Override
    @Transactional(readOnly = true)
    public Object getMenuCalendar(MenuRequestDto requestDto, String token) {
        int year = requestDto.getYear();
        int month = requestDto.getMonth();

        log.info("getMenuCalendar 함수 실행 - 년: {}, 월: {}", year, month);

        try {
            // 토큰 유효성
            if (!jwtService.validateToken(token)) {
                log.info("getMenuCalendar - 토큰 유효하지 않음");
                return ErrorResponseDto.of(BaperangErrorCode.INVALID_TOKEN);
            }

            Long userPk = jwtService.getUserId(token);
            log.info("getMenuCalendar - 사용자ID: {}", userPk);

            // 현재 로그인한 사용자의 학교 정보 조회
            User user = userRepository.findById(userPk)
                    .orElse(null);

            if (user == null) {
                log.info("getMenuCalendar - 사용자 정보 없음");
                return ErrorResponseDto.of(BaperangErrorCode.USER_NOT_FOUND);
            }

            School school = user.getSchool();

            // 해당 월의 시작일과 마지막 일 계산
            YearMonth yearMonth = YearMonth.of(year, month);
            LocalDate startDate = yearMonth.atDay(1);
            LocalDate endDate = yearMonth.atEndOfMonth();

            // 해당 기간의 메뉴 조회
            List<Menu> menus = menuRepository.findBySchoolAndMenuDateBetweenOrderByMenuDate(
                    school, startDate, endDate);

            // 날짜별로 메뉴 그룹화
            Map<LocalDate, List<Menu>> menusByDate = menus.stream()
                    .collect(Collectors.groupingBy(Menu::getMenuDate));

            // 날짜별 DTO 생성
            List<MenuResponseDto.Days> daysList = new ArrayList<>();
            LocalDate currentDate = startDate;
            DateTimeFormatter formatter = DateTimeFormatter.ISO_DATE;

            while (!currentDate.isAfter(endDate)) {
                List<Menu> dayMenus = menusByDate.getOrDefault(currentDate, Collections.emptyList());

                List<MenuResponseDto.Menus> menusList = dayMenus.stream()
                        .map(menu -> MenuResponseDto.Menus.builder()
                                .menuId(menu.getId())
                                .menuName(menu.getMenuName())
                                .build())
                        .collect(Collectors.toList());

                // 요일 이름
                DayOfWeek dayOfWeek = currentDate.getDayOfWeek();
                String dayOfWeekName = dayOfWeek.getDisplayName(TextStyle.SHORT, Locale.KOREAN);

                MenuResponseDto.Days day = MenuResponseDto.Days.builder()
                        .date(currentDate.format(formatter))
                        .dayOfWeekName(dayOfWeekName)
                        .menu(menusList)
                        .build();

                daysList.add(day);
                currentDate = currentDate.plusDays(1);
            }

            MenuResponseDto responseDto = MenuResponseDto.builder()
                    .days(daysList)
                    .build();

            log.info("getMenuCalendar 함수 성공 종료 - 일수: {}", daysList.size());
            return responseDto;
        } catch (Exception e) {
            log.error("메뉴 조회 중 오류 발생: {}", e.getMessage(), e);
            return ErrorResponseDto.of(BaperangErrorCode.INTERNAL_SERVER_ERROR);
        }
    }
}