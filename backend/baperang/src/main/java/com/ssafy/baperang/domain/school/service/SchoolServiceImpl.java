package com.ssafy.baperang.domain.school.service;

import org.springframework.stereotype.Service;

import com.ssafy.baperang.domain.school.dto.request.SchoolsRequestDto;

import com.ssafy.baperang.domain.school.dto.response.SchoolsResponseDto;
import com.ssafy.baperang.domain.school.dto.response.CitiesResponseDto;
import com.ssafy.baperang.domain.school.entity.School;
import com.ssafy.baperang.domain.school.repository.SchoolRepository;

import lombok.RequiredArgsConstructor;

import java.util.List;
import java.util.Collections;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class SchoolServiceImpl implements SchoolService {

    private final SchoolRepository schoolRepository;
    
    @Override
    public CitiesResponseDto getCities() {
        List<String> cities = schoolRepository.findCities();
        return new CitiesResponseDto(cities);
    }   

    @Override
    public SchoolsResponseDto getSchools(SchoolsRequestDto schoolsRequestDto) {
        List<School> schools;
        
        if (schoolsRequestDto.getCity() != null && !schoolsRequestDto.getCity().isEmpty()) {
            String schoolName = schoolsRequestDto.getSchoolName() != null ? schoolsRequestDto.getSchoolName() : "";
            schools = schoolRepository.findByCityAndSchoolNameStartingWith(
                schoolsRequestDto.getCity(), schoolName);
        } else {
            schools = Collections.emptyList();
        }
        
        return new SchoolsResponseDto(schools.stream().map(School::getSchoolName).collect(Collectors.toList()));
    }
}
