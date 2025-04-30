package com.ssafy.baperang.domain.user.controller;

import com.ssafy.baperang.domain.user.dto.request.LoginRequestDto;
import com.ssafy.baperang.domain.user.dto.request.SignupRequestDto;
import com.ssafy.baperang.domain.user.dto.request.ValidateIdRequestDto;
import com.ssafy.baperang.domain.user.dto.response.ErrorResponseDto;
import com.ssafy.baperang.domain.user.dto.response.ValidateIdResponseDto;
import com.ssafy.baperang.domain.user.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

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


//    @DeleteMapping("/logout/{userId}")
//    public ResponseEntity<?> logout(@PathVariable Long userId, HttpServeletResponse response)
}