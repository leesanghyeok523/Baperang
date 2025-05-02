package com.ssafy.baperang.domain.user.controller;

import com.ssafy.baperang.domain.user.dto.request.LoginRequestDto;
import com.ssafy.baperang.domain.user.dto.request.SignupRequestDto;
import com.ssafy.baperang.domain.user.dto.request.ValidateIdRequestDto;
import com.ssafy.baperang.domain.user.dto.response.ErrorResponseDto;
import com.ssafy.baperang.domain.user.dto.response.ValidateIdResponseDto;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import com.ssafy.baperang.domain.user.service.UserService;

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
    public ResponseEntity<?> login(@RequestBody LoginRequestDto requestDto) {
        log.info("login 컨트롤러 함수 호출");
        Object result = userService.login(requestDto);

        if (result instanceof ErrorResponseDto) {
            ErrorResponseDto errorResponse = (ErrorResponseDto) result;
            log.info("login 컨트롤러 함수 에러 응답");
            return ResponseEntity.status(errorResponse.getStatus()).body(result);
        }

        log.info("login 컨트롤러 함수 정상 응답");
        return ResponseEntity.ok(result);
    }

    @DeleteMapping("/logout/{userPk}")
    public ResponseEntity<?> logout(@PathVariable Long userPk) {
        log.info("logout 컨트롤러 함수 호출");
        // 쿠키 관련 코드는 JWT 구현 시 주석 해제
    /*
    HttpServletResponse response를 파라미터로 추가하고 아래 코드 활성화
    // 쿠키 삭제
    Cookie cookie = new Cookie("refreshToken", null);
    cookie.setMaxAge(0);
    cookie.setPath("/");
    cookie.setHttpOnly(true);
    cookie.setSecure(true); // HTTPS에서만 전송
    response.addCookie(cookie);
    */

        Object result = userService.logout(userPk);

        if (result instanceof ErrorResponseDto) {
            ErrorResponseDto errorRespnse = (ErrorResponseDto) result;
            log.info("logout 컨트롤러 함수 에러 응답");
            return ResponseEntity.status(errorRespnse.getStatus()).body(result);
        }
        log.info("logout 컨트롤러 함수 정상 응답");
        return ResponseEntity.ok(result);
    }
}