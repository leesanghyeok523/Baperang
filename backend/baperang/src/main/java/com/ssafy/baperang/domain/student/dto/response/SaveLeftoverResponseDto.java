package com.ssafy.baperang.domain.student.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SaveLeftoverResponseDto {
    private Long studentId;
    private String studentName;
    private LocalDate leftoverDate;
    private Integer count;
    private String message;
}