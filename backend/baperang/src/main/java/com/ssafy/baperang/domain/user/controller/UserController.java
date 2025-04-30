package com.ssafy.baperang.domain.user.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.ssafy.baperang.domain.user.dto.request.LoginRequestDto;
import com.ssafy.baperang.domain.user.dto.request.SignupRequestDto;
import com.ssafy.baperang.domain.user.dto.request.ValidateIdRequestDto;
import com.ssafy.baperang.domain.user.dto.response.ErrorResponseDto;
import com.ssafy.baperang.domain.user.dto.response.ValidateIdResponseDto;
import com.ssafy.baperang.domain.user.service.UserService;

import lombok.RequiredArgsConstructor;

@RestController // REST API 컨트롤러임을 spring에 알려줌
@RequestMapping("/api/v1/user") // 이 컨트롤러의 기본 URL 경로를 설정
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    @PostMapping("/signup")
    public ResponseEntity<?> signup(@RequestBody SignupRequestDto requestDto) {
        Object result = userService.signup(requestDto);

        if (result instanceof ErrorResponseDto) {
            ErrorResponseDto errorResponse = (ErrorResponseDto) result;
            return ResponseEntity.status(errorResponse.getStatus()).body(result);
        }

        return ResponseEntity.ok(result);
    }

    @PostMapping("/validate-id")
    public ResponseEntity<ValidateIdResponseDto> validateId(@RequestBody ValidateIdRequestDto requestDto) {
        boolean isValid = userService.isLoginIdAvailable(requestDto.getLoginId());

        ValidateIdResponseDto responseDto = ValidateIdResponseDto.builder()
                .valid(isValid)
                .build();

        return ResponseEntity.ok(responseDto);
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequestDto requestDto) {
        Object result = userService.login(requestDto);

        if (result instanceof ErrorResponseDto) {
            ErrorResponseDto errorResponse = (ErrorResponseDto) result;
            return ResponseEntity.status(errorResponse.getStatus()).body(result);
        }

        return ResponseEntity.ok(result);
    }

    @DeleteMapping("/logout/{userPk}")
    public ResponseEntity<?> logout(@PathVariable Long userPk) {
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
            return ResponseEntity.status(errorRespnse.getStatus()).body(result);
        }
        return ResponseEntity.ok(result);
    }
}