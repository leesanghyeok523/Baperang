package com.ssafy.baperang.domain.menu.service;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.YearMonth;
import java.time.format.DateTimeFormatter;
import java.time.format.TextStyle;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;

import com.ssafy.baperang.domain.holiday.entity.Holiday;
import com.ssafy.baperang.domain.holiday.repository.HolidayRepository;
import com.ssafy.baperang.domain.menu.dto.request.MenuRequestDto;
import com.ssafy.baperang.domain.menu.dto.request.MenuPlanRequestDto;
import com.ssafy.baperang.domain.menu.dto.response.ErrorResponseDto;
import com.ssafy.baperang.domain.menu.dto.response.MenuResponseDto;
import com.ssafy.baperang.domain.menu.entity.Menu;
import com.ssafy.baperang.domain.menu.repository.MenuRepository;
import com.ssafy.baperang.domain.menunutrient.entity.MenuNutrient;
import com.ssafy.baperang.domain.menunutrient.repository.MenuNutrientRepository;
import com.ssafy.baperang.domain.school.entity.School;
import com.ssafy.baperang.domain.user.entity.User;
import com.ssafy.baperang.domain.user.repository.UserRepository;
import com.ssafy.baperang.global.exception.BaperangErrorCode;
import com.ssafy.baperang.global.jwt.JwtService;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
@RequiredArgsConstructor
public class MenuServiceImpl implements MenuService {
    private final MenuRepository menuRepository;
    private final UserRepository userRepository;
    private final MenuNutrientRepository menuNutrientRepository;
    private final HolidayRepository holidayRepository;
    private final JwtService jwtService;

    @Value("${AI_SERVER_BASE_URL}")
    private String aiServerBaseUrl;

    private static final String MENU_PLAN_ENDPOINT = "/ai/menu-plan";

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
            
            // 한 번에 해당 기간의 공휴일 모두 조회
            List<Holiday> holidays = holidayRepository.findByHolidayDateBetween(startDate, endDate);
            log.info("공휴일 정보 조회 완료 - 개수: {}", holidays.size());
            
            // 날짜별로 공휴일 그룹화
            Map<LocalDate, List<Holiday>> holidaysByDate = holidays.stream()
                    .collect(Collectors.groupingBy(Holiday::getHolidayDate));
            
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
                // 요일 이름
                DayOfWeek dayOfWeek = currentDate.getDayOfWeek();
                String dayOfWeekName = dayOfWeek.getDisplayName(TextStyle.SHORT, Locale.KOREAN);
                
                // 현재 날짜의 공휴일 정보 가져오기
                List<Holiday> dayHolidays = holidaysByDate.getOrDefault(currentDate, Collections.emptyList());
                
                if (!dayHolidays.isEmpty()) {
                    // 공휴일인 경우
                    List<String> holidayNames = dayHolidays.stream()
                        .map(Holiday::getHolidayName)
                        .collect(Collectors.toList());
                    
                    MenuResponseDto.Days day = MenuResponseDto.Days.builder()
                            .date(currentDate.format(formatter))
                            .dayOfWeekName(dayOfWeekName)
                            .holiday(holidayNames)
                            .build();
                    
                    daysList.add(day);
                } else {
                    // 공휴일이 아닌 경우 기존 로직 적용
                    List<Menu> dayMenus = menusByDate.getOrDefault(currentDate, Collections.emptyList());

                    List<MenuResponseDto.Menus> menusList = dayMenus.stream()
                            .map(menu -> MenuResponseDto.Menus.builder()
                                    .menuId(menu.getId())
                                    .menuName(menu.getMenuName())
                                    .build())
                            .collect(Collectors.toList());

                    MenuResponseDto.Days day = MenuResponseDto.Days.builder()
                            .date(currentDate.format(formatter))
                            .dayOfWeekName(dayOfWeekName)
                            .menu(menusList)
                            .build();
                    
                    daysList.add(day);
                }
                
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

    @Override
    @Transactional(readOnly = true)
    public Object getOneDayMenu(String token, String date) { 
        
        try {
            // 토큰 유효성
            if (!jwtService.validateToken(token)) {
                log.info("getOneDayMenu - 토큰 유효하지 않음");
                return ErrorResponseDto.of(BaperangErrorCode.INVALID_TOKEN);
            }

            Long userPk = jwtService.getUserId(token);

            User user = userRepository.findById(userPk)
                    .orElse(null);

            if (user == null) {
                log.info("getOneDayMenu - 사용자 정보 없음");
                return ErrorResponseDto.of(BaperangErrorCode.USER_NOT_FOUND);
            }

            School school = user.getSchool();

            List<String> menu = menuRepository.findDistinctMenuNamesBySchoolAndMenuDate(school, LocalDate.parse(date));

            if (menu.isEmpty()) {
                log.info("getOneDayMenu - 오늘 메뉴 없음");
                menu.add("오늘은 메뉴가 없습니다.");
                return menu;
            }

            return menu;
        } catch (Exception e) {
            log.error("오늘 메뉴 조회 중 오류 발생: {}", e.getMessage(), e);
            return ErrorResponseDto.of(BaperangErrorCode.INTERNAL_SERVER_ERROR);
        }
    }

    @Override
    @Transactional(readOnly = true)
    public Object getTodayMenu(String token) { 
        
        try {
            // 토큰 유효성
            if (!jwtService.validateToken(token)) {
                log.info("getOneDayMenu - 토큰 유효하지 않음");
                return ErrorResponseDto.of(BaperangErrorCode.INVALID_TOKEN);
            }

            Long userPk = jwtService.getUserId(token);

            LocalDate today = LocalDate.now();

            User user = userRepository.findById(userPk)
                    .orElse(null);

            if (user == null) {
                log.info("getOneDayMenu - 사용자 정보 없음");
                return ErrorResponseDto.of(BaperangErrorCode.USER_NOT_FOUND);
            }

            School school = user.getSchool();

            List<String> menu = menuRepository.findDistinctMenuNamesBySchoolAndMenuDate(school, today);

            if (menu.isEmpty()) {
                log.info("getOneDayMenu - 오늘 메뉴 없음");
                menu.add("오늘은 메뉴가 없습니다.");
                return menu;
            }

            return menu;
        } catch (Exception e) {
            log.error("오늘 메뉴 조회 중 오류 발생: {}", e.getMessage(), e);
            return ErrorResponseDto.of(BaperangErrorCode.INTERNAL_SERVER_ERROR);
        }
    }

    @Override
    @Transactional(readOnly = true)
    public Object getMenuNutrient(String token, String menu, String date) {
        try {
            // 토큰 유효성
            if (!jwtService.validateToken(token)) {
                log.info("getMenuNutrient - 토큰 유효하지 않음");
                return ErrorResponseDto.of(BaperangErrorCode.INVALID_TOKEN);
            }

            Long userPk = jwtService.getUserId(token);
            log.info("getMenuNutrient - 사용자ID: {}", userPk);

            User user = userRepository.findById(userPk)
                    .orElse(null);

            if (user == null) {
                log.info("getMenuNutrient - 사용자 정보 없음");
                return ErrorResponseDto.of(BaperangErrorCode.USER_NOT_FOUND);
            }

            School school = user.getSchool();
            log.info("getMenuNutrient - 학교ID: {}", school.getId());
            
            LocalDate parsedDate;
            try {
                parsedDate = LocalDate.parse(date);
                log.info("getMenuNutrient - 날짜 파싱 성공: {}", parsedDate);
            } catch (Exception e) {
                log.error("getMenuNutrient - 날짜 파싱 실패: {}", e.getMessage());
                return ErrorResponseDto.of(BaperangErrorCode.INTERNAL_SERVER_ERROR);
            }

            log.info("getMenuNutrient - DB 조회 시도 - 학교ID: {}, 날짜: {}, 메뉴명: '{}'", 
                    school.getId(), parsedDate, menu);
            
            // 직접 메뉴 조회 먼저 시도 (디버깅용)
            List<Menu> allMenus = menuRepository.findBySchoolAndMenuDate(school, parsedDate);
            if (allMenus.isEmpty()) {
                log.info("getMenuNutrient - 해당 날짜에 메뉴가 없음");
            } else {
                log.info("getMenuNutrient - 해당 날짜의 전체 메뉴 목록:");
                for (Menu m : allMenus) {
                    log.info("  > 메뉴 ID: {}, 이름: '{}', 카테고리: {}", m.getId(), m.getMenuName(), m.getCategory());
                }
            }
            
            Menu db_menu = menuRepository.findBySchoolAndMenuDateAndMenuName(school, parsedDate, menu);

            if (db_menu == null) {
                log.info("getMenuNutrient - 메뉴 조회 실패, DB에서 해당 메뉴를 찾을 수 없음");
                return ErrorResponseDto.of(BaperangErrorCode.MENU_NOT_FOUND);
            }
            
            log.info("getMenuNutrient - 메뉴 조회 성공: ID={}, Name='{}'", db_menu.getId(), db_menu.getMenuName());

            // 해당 메뉴의 영양소 정보 조회
            List<MenuNutrient> menuNutrients = menuNutrientRepository.findByMenu(db_menu);
            log.info("getMenuNutrient - 영양소 정보 조회 완료, 개수: {}", menuNutrients.size());
            
            try {
                // 메뉴 엔티티의 getNutrientInfo 메서드를 통해 영양소 정보 반환
                Object result = db_menu.getNutrientInfo(menuNutrients);
                log.info("getMenuNutrient - 영양소 정보 변환 성공");
                return result;
            } catch (Exception e) {
                log.error("getMenuNutrient - 영양소 정보 변환 중 오류: {}", e.getMessage());
                log.error("Stack trace: ", e);
                return ErrorResponseDto.of(BaperangErrorCode.INTERNAL_SERVER_ERROR);
            }

        } catch (Exception e) {
            log.error("메뉴 영양소 조회 중 오류 발생: {}", e.getMessage());
            log.error("Stack trace: ", e);
            return ErrorResponseDto.of(BaperangErrorCode.INTERNAL_SERVER_ERROR);
        }
    }

    @Override
    public Object makeMonthMenu(String token) {
        try {
            // 토큰 유효성
            if (!jwtService.validateToken(token)) {
                log.info("makeMonthMenu - 토큰 유효하지 않음");
                return ErrorResponseDto.of(BaperangErrorCode.INVALID_TOKEN);
            }

            Long userPk = jwtService.getUserId(token);
            User user = userRepository.findById(userPk)
                    .orElse(null);

            if (user == null) {
                log.info("makeMonthMenu - 사용자 정보 없음");
                return ErrorResponseDto.of(BaperangErrorCode.USER_NOT_FOUND);
            }

            School school = user.getSchool();

            // 다음 달의 년도와 월 계산
            LocalDate today = LocalDate.now();
            LocalDate nextMonth = today.plusMonths(1);
            Integer year = nextMonth.getYear();
            Integer month = nextMonth.getMonthValue();
            
            // 다음 달의 시작일과 마지막 일 계산
            YearMonth nextYearMonth = YearMonth.of(year, month);
            LocalDate startDate = nextYearMonth.atDay(1);
            LocalDate endDate = nextYearMonth.atEndOfMonth();
            
            // 다음 달의 공휴일 조회
            List<Holiday> holidays = holidayRepository.findByHolidayDateBetween(startDate, endDate);
            log.info("다음 달 공휴일 정보 조회 완료 - 개수: {}", holidays.size());
            
            // 공휴일 정보 설정
            Map<String, String> holidayMap = new HashMap<>();
            DateTimeFormatter formatter = DateTimeFormatter.ISO_DATE;
            
            for (Holiday holiday : holidays) {
                String dateStr = holiday.getHolidayDate().format(formatter);
                holidayMap.put(dateStr, holiday.getHolidayName());
            }
            
            // 메뉴 풀 데이터를 카테고리별로 구성
            Map<String, String> menuPool = new HashMap<>();
            
            // 모든 메뉴 데이터 조회 (전체 데이터)
            List<Menu> allMenus = menuRepository.findBySchool(school);
            
            log.info("기존 메뉴 데이터 조회 완료 - 개수: {}", allMenus.size());
            
            // menuData 구조 생성 및 기존 메뉴 데이터로 채우기
            Map<String, Map<String, MenuPlanRequestDto.MenuDetailDto>> menuData = new HashMap<>();
            
            // 카테고리별 메뉴 풀 구성
            for (Menu menu : allMenus) {
                // 메뉴 풀에 추가 (메뉴이름 -> 카테고리)
                if (!menuPool.containsKey(menu.getMenuName())) {
                    menuPool.put(menu.getMenuName(), menu.getCategory());
                }
                
                // 영양소 정보 조회
                List<MenuNutrient> nutrients = menuNutrientRepository.findByMenu(menu);
                
                // 메뉴 데이터 구성
                String dateStr = menu.getMenuDate().format(formatter);
                if (!menuData.containsKey(dateStr)) {
                    menuData.put(dateStr, new HashMap<>());
                }
                
                Map<String, MenuPlanRequestDto.MenuDetailDto> dayMenus = menuData.get(dateStr);
                
                // 영양소 정보 맵 구성
                Map<String, Double> nutritionMap = new HashMap<>();
                for (MenuNutrient nutrient : nutrients) {
                    nutritionMap.put(
                        nutrient.getNutrient().getNutrientName(),
                        nutrient.getAmount().doubleValue()
                    );
                }
                
                // 메뉴별 잔반율 계산 (amount 필드 사용, 없으면 기본값)
                double leftover = (menu.getAmount() != null && menu.getAmount() > 0) 
                    ? (double) menu.getAmount() / 1000  // 1000 단위로 정규화 (0~1 사이로 변환)
                    : 0.2; // 기본 잔반율
                
                // 메뉴별 선호도 계산 (favorite 필드 사용, 없으면 기본값)
                double preference = (menu.getFavorite() != null) 
                    ? menu.getFavorite().doubleValue()  
                    : 3.0; // 기본 선호도 (5점 만점)
                
                // 메뉴 데이터에 추가
                dayMenus.put(menu.getMenuName(), MenuPlanRequestDto.MenuDetailDto.builder()
                        .leftover(leftover)
                        .preference(preference)
                        .nutrition(nutritionMap)
                        .build());
            }
            
            // 다음 달의 각 날짜에 대한 빈 맵 생성 (없는 경우)
            for (LocalDate date = startDate; !date.isAfter(endDate); date = date.plusDays(1)) {
                String dateStr = date.format(formatter);
                if (!menuData.containsKey(dateStr)) {
                    menuData.put(dateStr, new HashMap<>());
                }
            }
            
            // MenuPlanRequestDto 생성 (필드는 예시이며, 실제 DTO에 맞게 조정 필요)
            Map<String, Object> requestMap = new HashMap<>();
            requestMap.put("menuData", menuData);
            requestMap.put("menuPool", menuPool);
            requestMap.put("holidays", holidayMap);
            
            log.info("makeMonthMenu - 요청 데이터: {}", requestMap);
            
            String aiServerUrl = aiServerBaseUrl + MENU_PLAN_ENDPOINT;

            RestTemplate restTemplate = new RestTemplate();
            ResponseEntity<String> response = restTemplate.postForEntity(aiServerUrl, requestMap, String.class);
            
            if (response.getStatusCode().is2xxSuccessful()) {
                log.info("makeMonthMenu - AI 서버 응답 성공");
                return response.getBody();
            } else {
                log.error("makeMonthMenu - AI 서버 응답 실패: {}", response.getStatusCode());
                return ErrorResponseDto.of(BaperangErrorCode.INTERNAL_SERVER_ERROR);
            }
        } catch (Exception e) {
            log.error("메뉴 생성 중 오류 발생: {}", e.getMessage(), e);
            return ErrorResponseDto.of(BaperangErrorCode.INTERNAL_SERVER_ERROR);
        }
    }
}