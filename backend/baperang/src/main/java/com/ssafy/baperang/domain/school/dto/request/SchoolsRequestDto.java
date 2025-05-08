package com.ssafy.baperang.domain.school.dto.request;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
@AllArgsConstructor
public class SchoolsRequestDto {
    private String schoolName;
    private String city;
}
