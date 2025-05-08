package com.ssafy.baperang.domain.student.controller;

import com.ssafy.baperang.domain.leftover.dto.response.ErrorResponseDto;
import com.ssafy.baperang.domain.student.dto.request.GetStudentLeftoverRequestDto;
import com.ssafy.baperang.domain.student.dto.request.NfcStudentRequestDto;
import com.ssafy.baperang.domain.student.dto.request.SaveStudentLeftoverRequestDto;
import com.ssafy.baperang.domain.student.service.StudentService;
import com.ssafy.baperang.global.exception.BaperangErrorCode;
import com.ssafy.baperang.global.jwt.JwtService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.HashMap;

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

    @PostMapping("/saveleft")
    public ResponseEntity<?> saveStudentLeftover(
            @RequestHeader("Authorization") String authorizationHeader,
            @RequestBody SaveStudentLeftoverRequestDto requestDto) {
        log.info("saveStudentLeftover 함수 호출 - 학생 ID: {}, 학교 ID{}",
                requestDto.getStudentPk(), requestDto.getSchoolPk());

        String token = authorizationHeader.substring(7);

        if (!jwtService.validateToken(token)) {
            return ResponseEntity.status(401).body(ErrorResponseDto.of(
                    BaperangErrorCode.INVALID_TOKEN));
        }

        Long userId = jwtService.getUserId(token);
        log.info("saveStudentLeftover - 사용자 ID: {}", userId);

        Object result = studentService.saveStudentLeftover(userId, requestDto);

        if (result instanceof ErrorResponseDto) {
            ErrorResponseDto errorResponseDto = (ErrorResponseDto) result;
            return ResponseEntity.status(errorResponseDto.getStatus()).body(result);
        }

        log.info("saveStudentLeftover 컨트롤러 함수 정상 응답");
        return ResponseEntity.ok(result);
    }
    // 잔반 조회 API 추가
    @PostMapping("/getleft")
    public ResponseEntity<?> getStudentLeftover(
            @RequestHeader("Authorization") String authorizationHeader,
            @RequestBody GetStudentLeftoverRequestDto requestDto) {

        log.info("getStudentLeftover 컨트롤러 호출 - 날짜: {}, 학년: {}, 반: {}, 번호: {}",
                requestDto.getLeftoverDate(), requestDto.getGrade(),
                requestDto.getClassNum(), requestDto.getNumber());

        // JWT 토큰에서 사용자 ID 추출
        String token = authorizationHeader.substring(7); // "Bearer " 제거

        // 토큰 유효성 검사
        if (!jwtService.validateToken(token)) {
            log.info("getStudentLeftover - 토큰 유효하지 않음");
            return ResponseEntity.status(401).body(ErrorResponseDto.of(
                    BaperangErrorCode.INVALID_TOKEN));
        }

        Long userId = jwtService.getUserId(token);
        log.info("getStudentLeftover - 사용자 ID: {}", userId);

        Object result = studentService.getStudentLeftover(userId, requestDto.getLeftoverDate(), requestDto.getGrade(), requestDto.getClassNum(), requestDto.getNumber());

        if (result instanceof ErrorResponseDto) {
            ErrorResponseDto errorResponseDto = (ErrorResponseDto) result;
            log.info("getStudentLeftover 컨트롤러 함수 에러 - 상태: {}, 코드: {}, 메시지: {}",
                    errorResponseDto.getStatus(), errorResponseDto.getCode(), errorResponseDto.getMessage());
            return ResponseEntity.status(errorResponseDto.getStatus()).body(result);
        }

        log.info("getStudentLeftover 컨트롤러 정상 응답");
        return ResponseEntity.ok(result);
    }

    @PostMapping("/nfc/receive")
    public ResponseEntity<?> receiveNfcData(
            @RequestBody Long studentPk, Integer grade, Integer classNum, Integer number, String name, String gender, String status) {

        log.info("NFC 태깅 정보 수신 성공!");
        log.info("학생 정보: PK={}, 이름={}, 학년={}, 반={}, 번호={}, 성별={}, 상태={}",
                studentPk, name, grade, classNum, number, gender, status);

        // 요청이 성공적으로 처리되었음을 응답
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("message", "NFC 태깅 정보가 성공적으로 수신되었습니다.");

        return ResponseEntity.ok(response);
    }
}