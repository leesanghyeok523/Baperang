package com.ssafy.baperang.domain.leftover.service;

import com.ssafy.baperang.domain.leftover.dto.response.ErrorResponseDto;
import com.ssafy.baperang.domain.leftover.dto.response.LeftoverDateResponseDto;
import com.ssafy.baperang.domain.leftover.dto.response.LeftoverMonthResponseDto;
import com.ssafy.baperang.domain.leftover.entity.Leftover;
import com.ssafy.baperang.domain.leftover.repository.LeftoverRepository;
import com.ssafy.baperang.domain.menu.entity.Menu;
import com.ssafy.baperang.domain.menu.repository.MenuRepository;
import com.ssafy.baperang.domain.school.entity.School;
import com.ssafy.baperang.domain.student.entity.Student;
import com.ssafy.baperang.domain.student.repository.StudentRepository;
import com.ssafy.baperang.global.exception.BaperangErrorCode;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.text.DecimalFormatSymbols;
import java.time.LocalDate;
import java.time.YearMonth;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.*;
import java.util.stream.Collectors;
import java.text.DecimalFormat;

import static com.ssafy.baperang.domain.school.entity.QSchool.school;

@Slf4j
@Service
@RequiredArgsConstructor
public class LeftoverServiceImpl implements LeftoverService {

    private final LeftoverRepository leftoverRepository;
    private final MenuRepository menuRepository;
    private final StudentRepository studentRepository;
    private final DecimalFormat df = new DecimalFormat("#.##", new DecimalFormatSymbols(Locale.US));


    @Override
    @Transactional(readOnly = true)
    public Object getLeftoversByDate(String dateStr) {
        log.info("LeftoversByDate 함수 실행 - 날짜: {}", dateStr);

        try {
            // 문자열로 받은 날짜를 date로 변환
            LocalDate date = LocalDate.parse(dateStr, DateTimeFormatter.ISO_DATE);

            // 메뉴별 평균 잔반율 조회
            List<LeftoverDateResponseDto.MenuLeftoverRate> menuLeftoverRates
                    = leftoverRepository.findAverageLeftoverRateByDate(date);

            log.info("getLeftoversByDate 함수 성공 종료 - 메뉴 수: {}", menuLeftoverRates.size());

            // 결과를 Dto로 래핑하여 반환
            return LeftoverDateResponseDto.builder()
                    .leftovers(menuLeftoverRates)
                    .build();
        } catch (DateTimeParseException e) {
            return ErrorResponseDto.of(BaperangErrorCode.INVALID_INPUT_VALUE);
        } catch (Exception e) {
            return ErrorResponseDto.of(BaperangErrorCode.INTERNAL_SERVER_ERROR);
        }
    }

    @Override
    @Transactional(readOnly = true)
    public Object getLeftoversByMonth(int year, int month) {
        log.info("getLeftoversByMonth 함수 실행 - 년도: {}, 월: {}", year, month);

        try {
            // 유효한 월 범위 검증 (1-12)
            if (month < 1 || month > 12) {
                return ErrorResponseDto.of(BaperangErrorCode.INVALID_INPUT_VALUE);
            }

            // 해당 연도와 월의 데이터 조회
            List<Leftover> leftovers = leftoverRepository.findByYearAndMonth(year, month);

            // 날짜별로 그룹화하여 평균 계산
            Map<LocalDate, List<Leftover>> leftoversByDate = leftovers.stream()
                    .collect(Collectors.groupingBy(Leftover::getLeftoverDate));

            List<LeftoverMonthResponseDto.DailyLeftoverRate> dailyRates = new ArrayList<>();

            // 각 날짜별 평균 계산
            for (Map.Entry<LocalDate, List<Leftover>> entry : leftoversByDate.entrySet()) {
                LocalDate date = entry.getKey();
                List<Leftover> dailyLeftovers = entry.getValue();

                // 평균 계산
                double avgRate = dailyLeftovers.stream()
                        .mapToDouble(l -> l.getLeftoverRate())
                        .average()
                        .orElse(0.0);

                float formattedAvgRate = Float.parseFloat(df.format(avgRate));

                dailyRates.add(new LeftoverMonthResponseDto.DailyLeftoverRate(
                        date.format(DateTimeFormatter.ISO_DATE),
                        avgRate));
            }

            // 전체 데이터의 평균 계산
            float monthlyAverage = (float) leftovers.stream()
                    .mapToDouble(l -> l.getLeftoverRate())
                    .average()
                    .orElse(0.0);

            // 해당 월의 모든 날짜 데이터 확인
            // (데이터가 없는 날짜는 0.0으로 채움)
            List<LeftoverMonthResponseDto.DailyLeftoverRate> completeData = fillMissingDates(
                    year, month, dailyRates);

            log.info("getLeftoversByMonth 함수 성공 종료 - 데이터 수: {}, 월 평균: {}",
                    completeData.size(), monthlyAverage);

            // 결과를 Dto로 래핑하여 반환
            return LeftoverMonthResponseDto.builder()
                    .period("monthly")
                    .data(completeData)
                    .monthlyAverage(monthlyAverage)
                    .build();
        } catch (Exception e) {
            log.error("getLeftoversByMonth 함수 실행 중 오류 발생", e);
            return ErrorResponseDto.of(BaperangErrorCode.INTERNAL_SERVER_ERROR);
        }
    }

    // 누락된 날짜 데이터를 0.0으로 채우는 헬퍼 메소드
    private List<LeftoverMonthResponseDto.DailyLeftoverRate> fillMissingDates(
            int year, int month, List<LeftoverMonthResponseDto.DailyLeftoverRate> existingData) {

        // 결과를 저장할 맵 (날짜 -> 잔반율)
        Map<String, Float> rateByDate = new HashMap<>();

        // 기존 데이터를 맵에 저장
        for (LeftoverMonthResponseDto.DailyLeftoverRate data : existingData) {
            rateByDate.put(data.getDate(), data.getLeftoverRate());
        }

        // 해당 월의 마지막 날짜 계산
        YearMonth yearMonth = YearMonth.of(year, month);
        int lastDay = yearMonth.lengthOfMonth();

        // 전체 날짜에 대한 리스트 생성
        List<LeftoverMonthResponseDto.DailyLeftoverRate> result = new ArrayList<>();

        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd");

        for (int day = 1; day <= lastDay; day++) {
            LocalDate date = LocalDate.of(year, month, day);
            String dateStr = date.format(formatter);

            // 데이터가 있으면 사용, 없으면 0.0으로 설정
            Float rate = rateByDate.getOrDefault(dateStr, 0.0f);

            if (rate > 0.0f) {
                rate = Float.parseFloat(df.format(rate));
            }

            result.add(new LeftoverMonthResponseDto.DailyLeftoverRate(dateStr, rate));
        }

        return result;
    }

    @Override
    @Transactional
    public Object saveLeftovers(Long studentId, Map<String, Object> aiResponse) {
        log.info("학생 ID: {}의 잔반율 데이터 저장 시작", studentId);

        try {
            Optional<Student> studentOpt = studentRepository.findById(studentId);
            if (studentOpt.isEmpty()) {
                return ErrorResponseDto.of(BaperangErrorCode.STUDENT_NOT_FOUND);
            }

            Student student = studentOpt.get();
            LocalDate today = LocalDate.now();
            School schoolEntity = student.getSchool();

            // AI 서버 응답 검증
            if (!aiResponse.containsKey("leftoverRate")) {
                log.error("AI 응답 형식 오류: leftoverRate 키가 없음");
                return ErrorResponseDto.of(BaperangErrorCode.INVALID_INPUT_VALUE);
            }

            Map<String, Object> leftoverData = (Map<String, Object>) aiResponse.get("leftoverRate");

            List<Menu> todayMenus = menuRepository.findBySchoolAndMenuDate(schoolEntity, today);

            // ID 순으로 정렬
            todayMenus.sort(Comparator.comparing(Menu::getId));

            if (todayMenus.isEmpty()) {
                log.warn("해당 날짜({})의 메뉴 정보가 없습니다.", today);
                return ErrorResponseDto.of(BaperangErrorCode.MENU_NOT_FOUND);
            }

            // 카테고리별로 메뉴 분류 (PK 순서 유지)
            List<Menu> mainMenus = new ArrayList<>();
            List<Menu> sideMenus = new ArrayList<>();
            Menu riceMenu = null;
            Menu soupMenu = null;

            for (Menu menu : todayMenus) {
                String category = menu.getCategory();
                switch (category) {
                    case "main":
                        mainMenus.add(menu);
                        break;
                    case "side":
                        sideMenus.add(menu);
                        break;
                    case "rice":
                        riceMenu = menu;
                        break;
                    case "soup":
                        soupMenu = menu;
                        break;
                }
            }

            // 매핑 규칙에 따라 위치별 메뉴 매핑 (side1, side2 형식으로 변경)
            Map<String, Menu> positionMenuMap = new HashMap<>();

            // 예외 처리
            // 1. main 처리
            for (int i = 0; i < mainMenus.size() && i < 2; i++) {
                // i=0이면 side1, i=1이면 side2에 할당
                positionMenuMap.put("side" + (i + 1), mainMenus.get(i));
            }

            // 2. side 처리
            int sideIndex = 0;
            for (int position = 1; position <= 3; position++) {
                String key = "side" + position;
                // 이미 할당된 위치가 아니고, 아직 처리할 side 메뉴가 있다면
                if (!positionMenuMap.containsKey(key) && sideIndex < sideMenus.size()) {
                    positionMenuMap.put(key, sideMenus.get(sideIndex++));
                }
            }

            // 3. rice 카테고리 처리
            if (riceMenu != null) {
                positionMenuMap.put("rice", riceMenu);
            } else if (sideIndex < sideMenus.size()) {
                // rice가 없으면 남은 side 메뉴를 rice 위치에 할당
                positionMenuMap.put("rice", sideMenus.get(sideIndex++));
                log.info("Rice 메뉴 없음 - rice 위치에 side 메뉴 할당: {}",
                        positionMenuMap.get("rice").getMenuName());
            } else if (mainMenus.size() > 2) {
                // 남은 side 메뉴가 없고 main이 2개 초과라면 초과분 할당
                positionMenuMap.put("rice", mainMenus.get(2));
                log.info("Rice 메뉴 없음 - rice 위치에 main 메뉴 할당: {}",
                        positionMenuMap.get("rice").getMenuName());
            }

            // 4. soup 카테고리 처리
            if (soupMenu != null) {
                positionMenuMap.put("soup", soupMenu);
            }

            // 매핑 결과 로그
            for (Map.Entry<String, Menu> entry : positionMenuMap.entrySet()) {
                log.info("위치 {} 매핑: {} (PK: {}, 카테고리: {})",
                        entry.getKey(), entry.getValue().getMenuName(),
                        entry.getValue().getId(), entry.getValue().getCategory());
            }

            // AI 응답과 매핑하여 잔반 데이터 저장
            List<Leftover> savedLeftovers = new ArrayList<>();

            // side1, side2, side3 처리
            for (int i = 1; i <= 3; i++) {
                String key = "side" + i;
                if (leftoverData.containsKey(key) && positionMenuMap.containsKey(key)) {
                    Menu menu = positionMenuMap.get(key);
                    float leftoverRate = ((Number) leftoverData.get(key)).floatValue();

                    Leftover leftover = Leftover.builder()
                            .menu(menu)
                            .student(student)
                            .leftoverDate(today)
                            .leftMenuName(menu.getMenuName())
                            .leftoverRate(leftoverRate)
                            .build();

                    savedLeftovers.add(leftoverRepository.save(leftover));
                    log.info("잔반 데이터 저장: 위치={}, 메뉴={}, 카테고리={}, 잔반율={}%",
                            key, menu.getMenuName(), menu.getCategory(), leftoverRate);
                }
            }

            // rice 처리
            if (leftoverData.containsKey("rice") && positionMenuMap.containsKey("rice")) {
                Menu menu = positionMenuMap.get("rice");
                float leftoverRate = ((Number) leftoverData.get("rice")).floatValue();

                Leftover leftover = Leftover.builder()
                        .menu(menu)
                        .student(student)
                        .leftoverDate(today)
                        .leftMenuName(menu.getMenuName())
                        .leftoverRate(leftoverRate)
                        .build();

                savedLeftovers.add(leftoverRepository.save(leftover));
                log.info("잔반 데이터 저장: 위치=rice, 메뉴={}, 카테고리={}, 잔반율={}%",
                        menu.getMenuName(), menu.getCategory(), leftoverRate);
            }

            // soup 처리
            if (leftoverData.containsKey("soup") && positionMenuMap.containsKey("soup")) {
                Menu menu = positionMenuMap.get("soup");
                float leftoverRate = ((Number) leftoverData.get("soup")).floatValue();

                Leftover leftover = Leftover.builder()
                        .menu(menu)
                        .student(student)
                        .leftoverDate(today)
                        .leftMenuName(menu.getMenuName())
                        .leftoverRate(leftoverRate)
                        .build();

                savedLeftovers.add(leftoverRepository.save(leftover));
                log.info("잔반 데이터 저장: 위치=soup, 메뉴={}, 카테고리={}, 잔반율={}%",
                        menu.getMenuName(), menu.getCategory(), leftoverRate);
            }

            log.info("학생 ID: {}의 메뉴 {}개 잔반율 저장 완료", studentId, savedLeftovers.size());

            Map<String, Object> result = new HashMap<>();
            result.put("success", true);
            result.put("message", "학생 잔반율 저장 완료");
            result.put("leftoverCount", savedLeftovers.size());

            return result;
        } catch (Exception e) {
            log.error("잔반 데이터 저장 중 오류 발생: {}", e.getMessage(), e);
            return ErrorResponseDto.of(BaperangErrorCode.INTERNAL_SERVER_ERROR);
        }
    }

}