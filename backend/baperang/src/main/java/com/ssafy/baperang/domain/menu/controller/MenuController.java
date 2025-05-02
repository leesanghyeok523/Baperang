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

//    @GetMapping("/calendar")
//    public ResponseEntity<?> getMenuCalendar(
//            @ModelAttribute MenuRequestDto requestDto,
//            @RequestAttribute("userPk") Long userPk) {
//
//        log.info("getMenuCalendar 컨트롤러 함수 호출 - 년: {}, 월: {}, 사용자ID: {}",
//                requestDto.getYear(), requestDto.getMonth(), userPk);
//
//        Object result = menuService.getMenuCalendar(requestDto, userPk);
//
//        if (result instanceof ErrorResponseDto) {
//            ErrorResponseDto errorResponse = (ErrorResponseDto) result;
//            return ResponseEntity.status(errorResponse.getStatus()).body(result);
//        }
//
//        log.info("getMenuCalendar 컨트롤러 함수 정상 응답");
//        return ResponseEntity.ok(result);
//    }

    // jwt 하기전 확인용 코드
    @GetMapping("/calendar")
    public ResponseEntity<?> getMenuCalendar(
            @RequestParam int year,
            @RequestParam int month,
            @RequestHeader("X-User-PK") Long userPk) {  // 헤더로 변경

        MenuRequestDto requestDto = MenuRequestDto.builder()
                .year(year)
                .month(month)
                .build();

        Object result = menuService.getMenuCalendar(requestDto, userPk);

        if (result instanceof ErrorResponseDto) {
            ErrorResponseDto errorResponse = (ErrorResponseDto) result;
            return ResponseEntity.status(errorResponse.getStatus()).body(result);
        }

        return ResponseEntity.ok(result);
    }
}