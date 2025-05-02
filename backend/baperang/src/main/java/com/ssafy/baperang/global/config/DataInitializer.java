package com.ssafy.baperang.global.config;

import com.ssafy.baperang.domain.menu.service.MenuImportServiceImpl;
import com.ssafy.baperang.domain.school.entity.School;
import com.ssafy.baperang.domain.school.repository.SchoolRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.io.ClassPathResource;
import org.springframework.core.io.Resource;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.io.IOException;
import java.io.InputStream;

@Slf4j
@Component
@RequiredArgsConstructor
public class DataInitializer implements ApplicationRunner {

    private final MenuImportServiceImpl menuImportService;
    private final SchoolRepository schoolRepository;

    @Override
    @Transactional
    public void run(ApplicationArguments args) throws Exception {
        log.info("애플리케이션 시작 시 데이터 초기화 작업을 수행합니다.");

        // 기본 학교 데이터 초기화
        School school = initializeDefaultSchool();

        // 메뉴 데이터 가져오기
        importMenusFromExcel(school.getId());
    }

    /**
     * 기본 학교 데이터 초기화
     */
    private School initializeDefaultSchool() {
        // 기존 학교가 있는지 확인
        if (schoolRepository.count() > 0) {
            School existingSchool = schoolRepository.findAll().get(0);
            log.info("기존 학교 데이터를 사용합니다: {}", existingSchool.getSchoolName());
            return existingSchool;
        }

        // 새 학교 생성
        School school = School.builder()
                .schoolName("SSAFY 초등학교")
                .city("서울")
                .build();

        school = schoolRepository.save(school);
        log.info("새로운 학교 데이터를 생성했습니다: {}", school.getSchoolName());

        return school;
    }

    /**
     * 메뉴 데이터 가져오기
     */
    private void importMenusFromExcel(Long schoolId) {
        // 엑셀 파일 경로
        String excelFilePath = "메뉴더미.xlsx";
        Resource resource = new ClassPathResource(excelFilePath);

        if (!resource.exists()) {
            log.warn("메뉴 데이터 파일을 찾을 수 없습니다: {}", excelFilePath);
            return;
        }

        log.info("메뉴 데이터 파일을 찾았습니다: {}", excelFilePath);

        try {
            // 파일 콘텐츠를 바이트 배열로 읽기
            byte[] fileData;
            try (InputStream is = resource.getInputStream()) {
                fileData = is.readAllBytes();
            }

            // JSON으로 변환 (바이트 배열로 직접 처리)
            String jsonData = menuImportService.convertExcelToJsonFromBytes(fileData);
            log.info("엑셀 파일을 JSON으로 변환했습니다.");

            // DB에 저장
            menuImportService.importMenusFromJson(jsonData, schoolId);
            log.info("메뉴 데이터를 DB에 성공적으로 저장했습니다.");

        } catch (IOException e) {
            log.error("메뉴 데이터 가져오기 실패: {}", e.getMessage(), e);
        }
    }
}