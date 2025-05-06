package com.ssafy.baperang.domain.user.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.ssafy.baperang.domain.user.dto.request.LoginRequestDto;
import com.ssafy.baperang.domain.user.dto.request.SignupRequestDto;
import com.ssafy.baperang.domain.user.dto.request.ValidateIdRequestDto;
import com.ssafy.baperang.domain.user.dto.response.ErrorResponseDto;
import com.ssafy.baperang.domain.user.dto.response.ValidateIdResponseDto;
import com.ssafy.baperang.domain.user.service.UserService;

import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@RestController // REST API 컨트롤러임을 spring에 알려줌
@RequestMapping("/api/v1/user") // 이 컨트롤러의 기본 URL 경로를 설정
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    @PostMapping("/signup")
    public ResponseEntity<?> signup(@RequestBody SignupRequestDto requestDto) {
        log.info("signup 컨트롤러 함수 호출");
        Object result = userService.signup(requestDto);

        if (result instanceof ErrorResponseDto) {
            ErrorResponseDto errorResponse = (ErrorResponseDto) result;
            log.info("signup 컨트롤러 함수 에러 응답");
            return ResponseEntity.status(errorResponse.getStatus()).body(result);
        }

        log.info("signup 컨트롤러 함수 정상 응답");
        return ResponseEntity.ok(result);
    }

    @PostMapping("/validate-id")
    public ResponseEntity<ValidateIdResponseDto> validateId(@RequestBody ValidateIdRequestDto requestDto) {
        log.info("validateId 컨트롤러 함수 호출");
        boolean isValid = userService.isLoginIdAvailable(requestDto.getLoginId());

        ValidateIdResponseDto responseDto = ValidateIdResponseDto.builder()
                .valid(isValid)
                .build();

        log.info("validateId 컨트롤러 함수 응답");
        return ResponseEntity.ok(responseDto);
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequestDto requestDto, HttpServletResponse response) {
        log.info("login 컨트롤러 함수 호출");
        Object result = userService.login(requestDto, response);

        if (result instanceof ErrorResponseDto) {
            ErrorResponseDto errorResponse = (ErrorResponseDto) result;
            log.info("login 컨트롤러 함수 에러 응답");
            return ResponseEntity.status(errorResponse.getStatus()).body(result);
        }

        log.info("login 컨트롤러 함수 정상 응답");
        return ResponseEntity.ok(result);
    }

    @DeleteMapping("/logout")
    public ResponseEntity<?> logout
            (@RequestHeader("Authorization") String authorizationHeader,
             HttpServletResponse response) {
        log.info("logout 컨트롤러 함수 호출");

        String token = authorizationHeader.substring(7);
        
        Object result = userService.logout(token, response);

        if (result instanceof ErrorResponseDto) {
            ErrorResponseDto errorRespnse = (ErrorResponseDto) result;
            log.info("logout 컨트롤러 함수 에러 응답");
            return ResponseEntity.status(errorRespnse.getStatus()).body(result);
        }
        log.info("logout 컨트롤러 함수 정상 응답");
        return ResponseEntity.ok(result);
    }
    
    @PostMapping("/refresh")
    public ResponseEntity<?> refreshAccessToken(@CookieValue(name = "refreshToken", required = false) String refreshToken,
                                              HttpServletResponse response) {
        log.info("refreshAccessToken 컨트롤러 함수 호출");
        
        if (refreshToken == null) {
            log.info("refreshAccessToken - 리프레시 토큰 없음");
            ErrorResponseDto errorResponse = ErrorResponseDto.of(com.ssafy.baperang.global.exception.BaperangErrorCode.INVALID_REFRESH_TOKEN);
            return ResponseEntity.status(errorResponse.getStatus()).body(errorResponse);
        }
        
        Object result = userService.refreshAccessToken(refreshToken, response);
        
        if (result instanceof ErrorResponseDto) {
            ErrorResponseDto errorResponse = (ErrorResponseDto) result;
            log.info("refreshAccessToken 컨트롤러 함수 에러 응답");
            return ResponseEntity.status(errorResponse.getStatus()).body(result);
        }
        
        log.info("refreshAccessToken 컨트롤러 함수 정상 응답");
        return ResponseEntity.ok(result);
    }
}