package com.ssafy.baperang.domain.menu.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.ssafy.baperang.domain.menu.dto.request.MenuRequestDto;
import com.ssafy.baperang.domain.menu.dto.response.ErrorResponseDto;
import com.ssafy.baperang.domain.menu.service.MenuService;
import com.ssafy.baperang.global.exception.BaperangErrorCode;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

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

    @GetMapping("/menu_nutrient")
    public ResponseEntity<?> getmenunutrient(
            @RequestHeader("Authorization") String authorizationHeader,
            @RequestParam(required = true) String menu,
            @RequestParam(required = true) String date) {

        // 메뉴명 로깅 추가
        log.info("메뉴 영양소 조회 요청 - 원본 메뉴명: {}, 날짜: {}", menu, date);
        
        // 한글 인코딩 처리 시도
        try {
            // URL 디코딩
            String decodedMenu = java.net.URLDecoder.decode(menu, "UTF-8");
            log.info("메뉴 영양소 조회 - 디코딩된 메뉴명: {}", decodedMenu);
            
            // 디코딩된 메뉴명으로 서비스 호출
            String token = authorizationHeader.substring(7);
            Object result = menuService.getMenuNutrient(token, decodedMenu, date);
            
            if (result instanceof ErrorResponseDto) {
                ErrorResponseDto errorResponse = (ErrorResponseDto) result;
                log.info("getmenunutrient 컨트롤러 함수 에러 응답 - 코드: {}", errorResponse.getCode());
                return ResponseEntity.status(errorResponse.getStatus()).body(result);
            }
            
            log.info("getmenunutrient 컨트롤러 함수 정상 응답");
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            log.error("메뉴 디코딩 중 오류 발생: {}", e.getMessage(), e);
            ErrorResponseDto errorDto = ErrorResponseDto.of(BaperangErrorCode.INTERNAL_SERVER_ERROR);
            return ResponseEntity.status(errorDto.getStatus()).body(errorDto);
        }
    }

    // @PostMapping("/month_menu")
    // public ResponseEntity<?> getmonthlymenu(
    //         @RequestHeader("Authorization") String authorizationHeader) {

    // }

}
