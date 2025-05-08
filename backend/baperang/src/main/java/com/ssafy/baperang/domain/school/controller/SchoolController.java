package com.ssafy.baperang.domain.school.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.ssafy.baperang.domain.school.service.SchoolService;

import com.ssafy.baperang.domain.school.dto.request.SchoolsRequestDto;

import com.ssafy.baperang.domain.school.dto.response.SchoolsResponseDto;
import com.ssafy.baperang.domain.school.dto.response.CitiesResponseDto;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.RequestBody;

@RestController
@RequestMapping("/api/v1/school")
@RequiredArgsConstructor
public class SchoolController {

    private final SchoolService schoolService;

    @GetMapping("/cities")
    public CitiesResponseDto getCities() {
        return schoolService.getCities();
    }

    @GetMapping("/schools")
    public SchoolsResponseDto getSchools(@RequestBody SchoolsRequestDto schoolsRequestDto) {
        return schoolService.getSchools(schoolsRequestDto);
    }
}
