package com.ssafy.baperang.domain.student.service;

public interface StudentService {
    // 학생 이름 목록 조회
    Object getAllStudentNames(Long userId);

    // 학생 상세 정보 조회
    Object getStudentDetail(Long userId, Long studentId);
}