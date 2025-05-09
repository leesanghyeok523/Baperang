package com.ssafy.baperang.domain.menu.controller;

import com.ssafy.baperang.domain.menu.dto.request.MenuRequestDto;
import com.ssafy.baperang.domain.menu.dto.response.ErrorResponseDto;
import com.ssafy.baperang.domain.menu.service.MenuService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@Slf4j
@RequestMapping("api/v1/menu")
@RequiredArgsConstructor
public class MenuController {

    private final MenuService menuService;

    @GetMapping("/calendar")
    public ResponseEntity<?> getMenuCalendar(
            @RequestParam int year,
            @RequestParam int month,
            @RequestHeader("Authorization") String authorizationHeader) {

        log.info("getMenuCalendar 컨트롤러 함수 호출 - 년: {}, 월: {}", year, month);

        // "Bearer " 접두사 제거
        String token = authorizationHeader.substring(7);

        MenuRequestDto requestDto = MenuRequestDto.builder()
                .year(year)
                .month(month)
                .build();

        Object result = menuService.getMenuCalendar(requestDto, token);

        if (result instanceof ErrorResponseDto) {
            ErrorResponseDto errorResponse = (ErrorResponseDto) result;
            log.info("getMenuCalendar 컨트롤러 함수 에러 응답");
            return ResponseEntity.status(errorResponse.getStatus()).body(result);
        }

        log.info("getMenuCalendar 컨트롤러 함수 정상 응답");
        return ResponseEntity.ok(result);
    }

    @GetMapping("/today")
    public ResponseEntity<?> getTodayMenu(
            @RequestHeader("Authorization") String authorizationHeader) {

        log.info("getTodayMenu 컨트롤러 함수 호출");

        String token = authorizationHeader.substring(7);

        Object result = menuService.getTodayMenu(token);

        if (result instanceof ErrorResponseDto) {
            ErrorResponseDto errorResponse = (ErrorResponseDto) result;
            log.info("getTodayMenu 컨트롤러 함수 에러 응답");
            return ResponseEntity.status(errorResponse.getStatus()).body(result);
        }
        
        log.info("getTodayMenu 컨트롤러 함수 정상 응답");
        return ResponseEntity.ok(result);
    }

    @GetMapping("/oneday")
    public ResponseEntity<?> getOneDayMenu(
            @RequestHeader("Authorization") String authorizationHeader,
            @RequestParam String date) {

        log.info("getOneDayMenu 컨트롤러 함수 호출");

        String token = authorizationHeader.substring(7);

        Object result = menuService.getOneDayMenu(token, date);

        if (result instanceof ErrorResponseDto) {
            ErrorResponseDto errorResponse = (ErrorResponseDto) result;
            log.info("getOneDayMenu 컨트롤러 함수 에러 응답");
            return ResponseEntity.status(errorResponse.getStatus()).body(result);
        }

        log.info("getOneDayMenu 컨트롤러 함수 정상 응답");
        return ResponseEntity.ok(result);
    }
}
