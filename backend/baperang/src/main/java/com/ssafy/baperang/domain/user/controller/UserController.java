package com.ssafy.baperang.domain.user.controller;

import com.ssafy.baperang.domain.user.dto.request.SignupRequestDto;
import com.ssafy.baperang.domain.user.dto.request.ValidateIdRequestDto;
import com.ssafy.baperang.domain.user.dto.response.SignupResponseDto;
import com.ssafy.baperang.domain.user.dto.response.ValidateIdResponseDto;
import com.ssafy.baperang.domain.user.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController // REST API 컨트롤러임을 spring에 알려줌
@RequestMapping("/api/v1") // 이 컨트롤러의 기본 URL 경로를 설정
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    @PostMapping("/signup")
    public ResponseEntity<SignupResponseDto> signup(@RequestBody SignupRequestDto requestDto) {
        // ResponseEntity는 HTTP 응답의 상태 코드, 헤더, 본문을 포함하는 객체
        // RequestBody는 HTTP 요청 본문(JSON)을 SignupRequestDto 객체로 변환
        SignupResponseDto responseDto = userService.signup(requestDto);

        return ResponseEntity.ok(responseDto);
    }

    @PostMapping("/validate-id")
    public ResponseEntity<ValidateIdResponseDto> validateId(@RequestBody ValidateIdRequestDto requestDto) {
        boolean isValid = userService.isLoginIdAvailable(requestDto.getLoginId());

        ValidateIdResponseDto responseDto = ValidateIdResponseDto.builder()
                .valid(isValid)
                .build();

        return ResponseEntity.ok(responseDto);
    }
}