package com.ssafy.baperang.domain.leftover.service;

import com.ssafy.baperang.domain.leftover.dto.response.ErrorResponseDto;
import com.ssafy.baperang.domain.leftover.dto.response.LeftoverDateResponseDto;
import com.ssafy.baperang.domain.leftover.repository.LeftoverRepository;
import com.ssafy.baperang.domain.leftover.dto.request.LeftoverDateRequestDto;
import com.ssafy.baperang.global.exception.BaperangErrorCode;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.List;

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
}
