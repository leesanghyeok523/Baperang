package com.ssafy.baperang.domain.student.service;

import com.ssafy.baperang.domain.leftover.dto.response.ErrorResponseDto;
import com.ssafy.baperang.domain.student.dto.response.StudentDetailResponseDto;
import com.ssafy.baperang.domain.student.dto.response.StudentNamesResponseDto;
import com.ssafy.baperang.domain.student.entity.Student;
import com.ssafy.baperang.domain.student.repository.StudentRepository;
import com.ssafy.baperang.domain.user.entity.User;
import com.ssafy.baperang.domain.user.repository.UserRepository;
import com.ssafy.baperang.global.exception.BaperangErrorCode;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Slf4j
@Service
@RequiredArgsConstructor
public class StudentServiceImpl implements StudentService {

    private final StudentRepository studentRepository;
    private final UserRepository userRepository;

    @Override
    @Transactional(readOnly = true)
    public Object getAllStudentNames(Long userId) {
        log.info("getAllStudentNames 함수 실행 - 사용자 ID: {}", userId);

        try {
            // 현재 로그인한 사용자 정보 조회
            User user = userRepository.findById(userId)
                    .orElseThrow(() -> new RuntimeException("사용자를 찾을 수 없습니다."));

            // 사용자의 학교 ID로 학생 이름 목록 조회
            List<String> studentNames = studentRepository.findAllStudentNamesBySchoolId(user.getSchool().getId());

            log.info("getAllStudentNames 함수 성공 종료 - 학생 수: {}", studentNames.size());

            // 결과 반환
            return StudentNamesResponseDto.builder()
                    .studentNames(studentNames)
                    .build();

        } catch (Exception e) {
            log.error("getAllStudentNames 함수 실행 중 오류 발생", e);
            return ErrorResponseDto.of(BaperangErrorCode.INTERNAL_SERVER_ERROR);
        }
    }

    @Override
    @Transactional(readOnly = true)
    public Object getStudentDetail(Long userId, Long studentId) {
        log.info("getStudentDetail 함수 실행 - 사용자 ID: {}, 학생 ID: {}", userId, studentId);

        try {
            // 현재 로그인한 사용자 정보 조회
            User user = userRepository.findById(userId)
                    .orElseThrow(() -> new RuntimeException("사용자를 찾을 수 없습니다."));

            // 학교 ID와 학생 ID로 학생 조회 (권한 확인)
            Optional<Student> studentOpt = studentRepository.findByIdAndSchoolId(studentId, user.getSchool().getId());

            // 학생이 존재하지 않거나 다른 학교의 학생인 경우
            if (studentOpt.isEmpty()) {
                log.info("getStudentDetail 함수 실행 - 학생 없음 또는 접근 권한 없음 (ID: {})", studentId);
                return ErrorResponseDto.of(BaperangErrorCode.STUDENT_NOT_FOUND);
            }

            // Entity를 DTO로 변환하여 반환
            StudentDetailResponseDto responseDto = StudentDetailResponseDto.fromEntity(studentOpt.get());

            log.info("getStudentDetail 함수 성공 종료 - 학생 ID: {}, 이름: {}",
                    responseDto.getStudentId(), responseDto.getStudentName());

            return responseDto;

        } catch (Exception e) {
            log.error("getStudentDetail 함수 실행 중 오류 발생", e);
            return ErrorResponseDto.of(BaperangErrorCode.INTERNAL_SERVER_ERROR);
        }
    }
}