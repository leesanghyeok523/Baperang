package com.ssafy.baperang.domain.student.service;

//import aj.org.objectweb.asm.TypeReference;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.ssafy.baperang.domain.student.dto.request.NfcStudentRequestDto;
import com.ssafy.baperang.domain.student.dto.response.ErrorResponseDto;
import com.ssafy.baperang.domain.student.entity.Student;
import com.ssafy.baperang.domain.student.repository.StudentRepository;
import com.ssafy.baperang.global.exception.BaperangErrorCode;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.fasterxml.jackson.core.type.TypeReference;

import java.time.LocalDate;
import java.util.*;

@Slf4j
@Service
@RequiredArgsConstructor
public class NfcServiceImpl implements NfcService {

    private final StudentRepository studentRepository;
    private final ObjectMapper objectMapper;

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

        log.info("학생 정보 검증 성공: 학생명: {}, 학년: {}, 반: {}, 번호: {}, 학교: {}",
                student.getStudentName(), student.getGrade(), student.getClassNum(),
                student.getNumber(), student.getSchool() != null ? student.getSchool().getSchoolName() : "없음");

        return true; // 검증 성공
    }

    @Override
    @Transactional
    public void saveBeforeImageUrls(NfcStudentRequestDto requestDto) {
        log.info("식전 url 저장 시작: studentPk = {}", requestDto.getStudentPk());

        if (requestDto.getStudentPk() == null) {
            log.error("학생 ID가 없음");
            return;
        }

        if (requestDto.getS3Url() == null || requestDto.getS3Url().isEmpty()) {
            log.error("이미지 URL 없음");
            return;
        }

        try {
            Optional<Student> studentOpt = studentRepository.findById(requestDto.getStudentPk());
            if (studentOpt.isEmpty()) {
                log.error("존재하지 않는 학생 ID: {}", requestDto.getStudentPk());
                return;
            }

            Student student = studentOpt.get();

            // json 형식으로 url 변환
            String jsonUrls;
            try {
                jsonUrls = objectMapper.writeValueAsString(requestDto.getS3Url());
            } catch (JsonProcessingException e) {
                log.error("URL JSON 변환 오류: {}", e.getMessage(), e);
                return;
            }

            // URL 확인 로그
            log.info("학생: {}, 저장할 URL 개수: {}", student.getStudentName(), requestDto.getS3Url().size());
            requestDto.getS3Url().forEach((key, url) -> {
                log.info("URL {}: {}", key, url);
            });

            // 현재 날짜
            LocalDate today = LocalDate.now();

            // 날짜 검증 - DB 날짜와 오늘 날짜 비교
            LocalDate studentDate = student.getImageDate();
            boolean dateMatches = (studentDate != null && studentDate.equals(today));

            log.info("날짜 검증: DB 날짜={}, 오늘 날짜={}, 일치 여부={}",
                    studentDate, today, dateMatches);

            // student 엔티티의 updateImage 메서드 사용
            Student updatedStudent = Student.updateImage(student, jsonUrls);
            Student saved = studentRepository.saveAndFlush(updatedStudent);

            log.info("식전 이미지 URL 저장 완료: 학생={}, 저장된 URL 수={}, 날짜 변경 여부={}",
                    saved.getStudentName(), requestDto.getS3Url(), !dateMatches);

        } catch (Exception e) {
            log.error("식사 전 이미지 URL 저장 중 오류: {}", e.getMessage(), e);
        }
    }

    @Override
    public void checkAfterImageUrl(NfcStudentRequestDto requestDto) {
        log.info("식사 후 이미지 확인 시작: studentPk={}", requestDto.getStudentPk());

        if (requestDto.getStudentPk() == null) {
            log.error("학생 ID 가 없음");
            return;
        }

        if (requestDto.getS3Url() == null || requestDto.getS3Url().isEmpty()) {
            log.error("이미지 URL 없음");
            return;
        }

        try {
            Optional<Student> studentOpt = studentRepository.findById(requestDto.getStudentPk());
            if (studentOpt.isEmpty()) {
                log.error("존재하지 않는 학생 ID: {}", requestDto.getStudentPk());
                return;
            }

            Student student = studentOpt.get();

            LocalDate today = LocalDate.now();

            if (student.getImageDate() == null || !student.getImageDate().equals(today) || student.getImage() == null) {
                log.error("오늘 날짜의 식전 이미지 없음");
                return;
            }

            // 식전 이미지 파싱
            Map<String, String> beforeImageUrlMap = new HashMap<>();
            if (student.getImage() != null && !student.getImage().isEmpty()) {
                try {
                    beforeImageUrlMap = objectMapper.readValue(student.getImage(), new TypeReference<Map<String, String>>() {});
                } catch (JsonProcessingException e) {
                    log.error("저장된 이미지 URL JSON 파싱 오류: {}", e.getMessage(), e);
                    return;
                }
            }

            // 식후 이미지 url 리스트 생성
            Map<String, String> afterImageUrlMap = requestDto.getS3Url();

            log.info("식전 이미지 url 수: {}", beforeImageUrlMap.size());
            log.info("식후 이미지 url 수: {}", afterImageUrlMap.size());

            beforeImageUrlMap.forEach((key, url) -> {
                log.info("식전 이미지 URL {}: {}", key, url);
            });

            afterImageUrlMap.forEach((key, url) -> {
                log.info("식후 이미지 URL {}: {}", key, url);
            });

            log.info("식후 이미지 확인 완료: 학생={}", student.getStudentName());
        } catch (Exception e) {
            log.error("식후 이미지 확인 중 오류: {}", e.getMessage(), e);
        }
    }


}