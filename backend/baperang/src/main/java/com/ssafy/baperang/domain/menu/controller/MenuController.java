package com.ssafy.baperang.domain.menu.controller;

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
            @RequestAttribute("userPk") Long userPk) {

        log.info("getMenuCalendar 컨트롤러 함수 호출 - 년: {}, 월: {}, 사용자ID: {}", year, month, userPk);

        Object result = menuService.getMenuCalendar(year, month, userPk);

        if (result instanceof ErrorResponseDto) {
            ErrorResponseDto errorResponse = (ErrorResponseDto) result;
            return ResponseEntity.status(errorResponse.getStatus()).body(result);
        }

        log.info("getMenuCalendar 컨트롤러 함수 정상 응답");
        return ResponseEntity.ok(result);
    }
}
