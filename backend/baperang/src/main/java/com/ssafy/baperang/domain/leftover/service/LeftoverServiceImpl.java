package com.ssafy.baperang.domain.leftover.service;

import com.ssafy.baperang.domain.leftover.dto.response.ErrorResponseDto;
import com.ssafy.baperang.domain.leftover.dto.response.LeftoverDateResponseDto;
import com.ssafy.baperang.domain.leftover.dto.response.LeftoverMonthResponseDto;
import com.ssafy.baperang.domain.leftover.entity.Leftover;
import com.ssafy.baperang.domain.leftover.repository.LeftoverRepository;
import com.ssafy.baperang.global.exception.BaperangErrorCode;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.YearMonth;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class LeftoverServiceImpl implements LeftoverService {

    private final LeftoverRepository leftoverRepository;

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

            result.add(new LeftoverMonthResponseDto.DailyLeftoverRate(dateStr, rate));
        }

        return result;
    }
}