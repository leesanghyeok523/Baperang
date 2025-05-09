package com.ssafy.baperang.domain.student.service;

import com.ssafy.baperang.domain.student.dto.request.NfcStudentRequestDto;
import com.ssafy.baperang.domain.student.dto.response.ErrorResponseDto;
import com.ssafy.baperang.domain.student.entity.Student;
import com.ssafy.baperang.domain.student.repository.StudentRepository;
import com.ssafy.baperang.global.exception.BaperangErrorCode;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

@Slf4j
@Service
@RequiredArgsConstructor
public class NfcServiceImpl implements NfcService {

    private final StudentRepository studentRepository;

    @Override
    @Transactional(readOnly = true)
    public Object verifyStudentData(NfcStudentRequestDto requestDto) {
        log.info("학생 정보 검증 시작: PK={}, 이름={}", requestDto.getStudentPk(), requestDto.getStudentName());

        // 필수 파라미터 검증
        if (requestDto.getStudentPk() == null) {
            log.error("학생 ID가 없음");
            return ErrorResponseDto.of(BaperangErrorCode.INVALID_INPUT_VALUE);
        }

        // 학생 정보 조회
        Optional<Student> studentOpt = studentRepository.findById(requestDto.getStudentPk());
        if (studentOpt.isEmpty()) {
            log.error("존재하지 않는 학생 ID: {}", requestDto.getStudentPk());
            return ErrorResponseDto.of(BaperangErrorCode.STUDENT_NOT_FOUND);
        }

        Student student = studentOpt.get();

        // 학생 정보 검증
        Object validationResult = validateStudentInfo(student, requestDto);
        if (validationResult instanceof ErrorResponseDto) {
            return validationResult;
        }

        // 검증 성공 응답
        Map<String, Object> result = new HashMap<>();
        result.put("success", true);
        result.put("message", "학생 정보가 확인되었습니다.");
        result.put("status", requestDto.getStatus());
        result.put("studentInfo", Map.of(
                "studentPk", student.getId(),
                "studentName", student.getStudentName(),
                "grade", student.getGrade(),
                "classNum", student.getClassNum(),
                "number", student.getNumber(),
                "gender", student.getGender(),
                "schoolName", student.getSchool() != null ? student.getSchool().getSchoolName() : null
        ));

        // S3 URL 정보 로깅
        Map<String, String> s3Urls = requestDto.getS3Url();
        if (s3Urls != null && !s3Urls.isEmpty()) {
            log.info("S3 URL 정보 확인:");
            s3Urls.forEach((key, value) -> {
                log.info("  {} = {}", key, value);
            });
        }

        return result;
    }

    /**
     * 학생 정보 검증
     */
    private Object validateStudentInfo(Student student, NfcStudentRequestDto requestDto) {
        StringBuilder errorMessage = new StringBuilder();
        boolean isValid = true;

        // 이름 검증
        if (!student.getStudentName().equalsIgnoreCase(requestDto.getStudentName())) {
            isValid = false;
            errorMessage.append("이름 불일치(DB: ").append(student.getStudentName())
                    .append(", 입력: ").append(requestDto.getStudentName()).append(") ");
        }

        // 학년 검증
        if (!student.getGrade().equals(requestDto.getGrade())) {
            isValid = false;
            errorMessage.append("학년 불일치(DB: ").append(student.getGrade())
                    .append(", 입력: ").append(requestDto.getGrade()).append(") ");
        }

        // 반 검증
        if (!student.getClassNum().equals(requestDto.getClassNum())) {
            isValid = false;
            errorMessage.append("반 불일치(DB: ").append(student.getClassNum())
                    .append(", 입력: ").append(requestDto.getClassNum()).append(") ");
        }

        // 번호 검증
        if (!student.getNumber().equals(requestDto.getNumber())) {
            isValid = false;
            errorMessage.append("번호 불일치(DB: ").append(student.getNumber())
                    .append(", 입력: ").append(requestDto.getNumber()).append(")");
        }

        if (!isValid) {
            log.error("학생 정보 검증 실패: {}", errorMessage);
            return ErrorResponseDto.of(BaperangErrorCode.INVALID_INPUT_VALUE);
        }

        return true; // 검증 성공
    }
}