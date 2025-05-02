package com.ssafy.baperang.domain.leftover.controller;

import com.ssafy.baperang.domain.leftover.dto.response.ErrorResponseDto;
import com.ssafy.baperang.domain.leftover.service.LeftoverService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@Slf4j
@RestController
@RequestMapping("/api/v1/menu")
@RequiredArgsConstructor
public class LeftoverController {

    private final LeftoverService leftoverService;

    @GetMapping("/leftover/date/{date}")
    public ResponseEntity<?> getLeftoversByDate(@PathVariable String date) {
        log.info("getLeftoversByDate 함수 호출 - 날짜: {}", date);

        Object result = leftoverService.getLeftoversByDate(date);

        if (result instanceof ErrorResponseDto) {
            ErrorResponseDto errorResponse = (ErrorResponseDto) result;
            log.info("getLeftoversByDate 컨트롤러 함수 에러 응답");
            return ResponseEntity.status(errorResponse.getStatus()).body(result);
        }

        log.info("getLeftoversByDate 함수 정상 응답");
        return ResponseEntity.ok(result);

    }
}
