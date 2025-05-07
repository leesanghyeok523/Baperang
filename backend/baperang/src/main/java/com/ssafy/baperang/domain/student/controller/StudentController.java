package com.ssafy.baperang.domain.student.controller;

import com.ssafy.baperang.domain.leftover.dto.response.ErrorResponseDto;
import com.ssafy.baperang.domain.student.service.StudentService;
import com.ssafy.baperang.global.jwt.JwtService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@Slf4j
@RestController
@RequestMapping("/api/v1/student")
@RequiredArgsConstructor
public class StudentController {

    private final StudentService studentService;
    private final JwtService jwtService;

    @GetMapping("/studentname/all")
    public ResponseEntity<?> getAllStudentNames(@RequestHeader("Authorization") String authorizationHeader) {
        log.info("getAllStudentNames 함수 호출");

        // JWT 토큰에서 사용자 ID 추출
        String token = authorizationHeader.substring(7); // "Bearer " 제거
        Long userId = jwtService.getUserId(token);

        Object result = studentService.getAllStudentNames(userId);

        if (result instanceof ErrorResponseDto) {
            ErrorResponseDto errorResponseDto = (ErrorResponseDto) result;
            return ResponseEntity.status(errorResponseDto.getStatus()).body(result);
        }

        log.info("getAllStudentNames 정상 응답");
        return ResponseEntity.ok(result);
    }

    @GetMapping("/studentname/{studentpk}")
    public ResponseEntity<?> getStudentDetail(
            @RequestHeader("Authorization") String authorizationHeader,
            @PathVariable("studentpk") Long studentId) {
        log.info("getStudentDetail 컨트롤러 호출 - 학생 ID: {}", studentId);

        // JWT 토큰에서 사용자 ID 추출
        String token = authorizationHeader.substring(7); // "Bearer " 제거
        Long userId = jwtService.getUserId(token);

        Object result = studentService.getStudentDetail(userId, studentId);

        if (result instanceof ErrorResponseDto) {
            ErrorResponseDto errorResponseDto = (ErrorResponseDto) result;
            return ResponseEntity.status(errorResponseDto.getStatus()).body(result);
        }

        log.info("getStudentDetail 컨트롤러 정상 응답");
        return ResponseEntity.ok(result);
    }
}