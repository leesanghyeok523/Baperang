package com.ssafy.baperang.global.config;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.nio.charset.Charset;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.ArrayList;
import java.util.List;
import java.util.Objects;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.dao.DataAccessException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

import lombok.extern.slf4j.Slf4j;

@Slf4j
@Component
@Order(3)
public class MenuCsvDataLoader implements CommandLineRunner {

    private final JdbcTemplate jdbcTemplate;
    private int totalLines = 0;
    private int processedLines = 0;
    private int failedLines = 0;

    @Autowired
    public MenuCsvDataLoader(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @Override
    public void run(String... args) throws Exception {
        // 데이터베이스 테이블에 이미 데이터가 있는지 확인
        Integer count = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM menu", Integer.class);
        
        if (count != null && count > 0) {
            log.info("Menu 테이블에 이미 {} 개의 데이터가 존재합니다. CSV 로드를 건너뜁니다.", count);
            return;
        }
        
        // 학교 테이블에 데이터가 있는지 확인
        Integer schoolCount = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM school", Integer.class);
        if (schoolCount == null || schoolCount == 0) {
            log.warn("School 테이블이 비어 있습니다. 메뉴 데이터를 저장할 학교가 없습니다.");
            return;
        }
        
        log.info("Menu 테이블이 비어 있습니다. CSV 파일에서 메뉴 데이터 로드를 시작합니다.");
        loadMenuData();
        log.info("완료: 총 {} 라인 중 {} 라인 처리 성공, {} 라인 실패", 
                 totalLines, processedLines, failedLines);
    }

    private void loadMenuData() {
        try (BufferedReader reader = new BufferedReader(
                new InputStreamReader(
                        Objects.requireNonNull(getClass().getResourceAsStream("/메뉴더미.csv")),
                        Charset.forName("EUC-KR")))) {

            // 전체 라인 수 미리 계산
            countTotalLines();
            
            // 헤더 스킵
            String line = reader.readLine();
            if (line != null) {
                log.info("CSV 헤더: {}", line);
            }
            
            List<Object[]> batch = new ArrayList<>();
            int batchCount = 0;
            
            while ((line = reader.readLine()) != null) {
                try {
                    // CSV 라인 파싱 - 쉼표가 포함된 필드를 올바르게 처리
                    String[] data = parseCSVLine(line);
                    
                    if (data.length >= 4) {
                        String city = data[0].trim();
                        String schoolName = data[1].trim();
                        String menuName = data[2].trim();
                        String menuDateStr = data[3].trim();
                        
                        // 날짜 파싱 (YYYYMMDD 형식 가정)
                        LocalDate menuDate = null;
                        try {
                            menuDate = LocalDate.parse(menuDateStr, DateTimeFormatter.ofPattern("yyyyMMdd"));
                        } catch (DateTimeParseException e) {
                            log.warn("날짜 파싱 오류, 행 스킵: {}, 날짜: {}, 오류: {}", line, menuDateStr, e.getMessage());
                            failedLines++;
                            continue;
                        }
                        
                        // 데이터 검증
                        if (city.isEmpty() || schoolName.isEmpty() || menuName.isEmpty()) {
                            log.warn("유효하지 않은 데이터 스킵: {}", line);
                            failedLines++;
                            continue;
                        }
                        
                        // 학교 ID 조회
                        Integer schoolId = getSchoolId(schoolName, city);
                        if (schoolId == null) {
                            log.warn("해당 학교를 찾을 수 없음: {}, {}", schoolName, city);
                            failedLines++;
                            continue;
                        }
                        
                        // 이미 같은 메뉴가 있는지 확인
                        if (menuExists(schoolId, menuDate, menuName)) {
                            log.info("이미 존재하는 메뉴 스킵: {}, {}, {}", schoolName, menuDate, menuName);
                            continue;
                        }
                        
                        batch.add(new Object[]{schoolId, menuDate, menuName, 0.0f});
                        
                        // 500개씩 배치 처리
                        if (batch.size() >= 500) {
                            int inserted = executeBatch(batch);
                            processedLines += inserted;
                            batchCount++;
                            log.info("배치 #{} 처리 완료: {} 레코드 삽입", batchCount, inserted);
                            batch.clear();
                        }
                    } else {
                        log.warn("열 수가 부족한 행 스킵: {}", line);
                        failedLines++;
                    }
                } catch (Exception e) {
                    log.error("행 처리 중 오류 발생: {}, 오류: {}", line, e.getMessage(), e);
                    failedLines++;
                }
            }
            
            // 남은 배치 처리
            if (!batch.isEmpty()) {
                int inserted = executeBatch(batch);
                processedLines += inserted;
                batchCount++;
                log.info("마지막 배치 #{} 처리 완료: {} 레코드 삽입", batchCount, inserted);
            }
            
            // 실제 처리된 데이터 수 확인
            int count = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM menu", Integer.class);
            log.info("데이터베이스의 menu 테이블 레코드 수: {}", count);
            
        } catch (Exception e) {
            log.error("메뉴 데이터 로드 중 오류 발생: {}", e.getMessage(), e);
        }
    }
    
    // 쉼표가 포함된 필드를 올바르게 파싱하는 메서드
    private String[] parseCSVLine(String line) {
        List<String> tokens = new ArrayList<>();
        StringBuilder sb = new StringBuilder();
        boolean inQuotes = false;
        
        for (char c : line.toCharArray()) {
            if (c == '\"') {
                inQuotes = !inQuotes; // 따옴표 상태 전환
            } else if (c == ',' && !inQuotes) {
                // 따옴표 밖의 쉼표는 필드 구분자로 처리
                tokens.add(sb.toString());
                sb.setLength(0);
            } else {
                sb.append(c);
            }
        }
        
        // 마지막 토큰 추가
        tokens.add(sb.toString());
        
        return tokens.toArray(new String[0]);
    }
    
    private boolean menuExists(Integer schoolId, LocalDate menuDate, String menuName) {
        try {
            Integer count = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM menu WHERE school_pk = ? AND menu_date = ? AND menu_name = ?", 
                Integer.class, 
                schoolId, menuDate, menuName
            );
            return count != null && count > 0;
        } catch (Exception e) {
            log.warn("메뉴 중복 확인 중 오류: {}", e.getMessage());
            return false;
        }
    }
    
    private Integer getSchoolId(String schoolName, String city) {
        try {
            return jdbcTemplate.queryForObject(
                "SELECT school_pk FROM school WHERE school_name = ? AND city = ?", 
                Integer.class, 
                schoolName, city
            );
        } catch (Exception e) {
            log.warn("학교 ID 조회 중 오류: {}, {}", schoolName, city);
            return null;
        }
    }
    
    private void countTotalLines() {
        try (BufferedReader reader = new BufferedReader(
                new InputStreamReader(
                        Objects.requireNonNull(getClass().getResourceAsStream("/메뉴더미.csv")),
                        Charset.forName("EUC-KR")))) {
            
            totalLines = 0;
            while (reader.readLine() != null) {
                totalLines++;
            }
            log.info("CSV 파일 총 라인 수: {} (헤더 포함)", totalLines);
            
        } catch (Exception e) {
            log.error("총 라인 수 계산 중 오류 발생: {}", e.getMessage());
        }
    }
    
    private int executeBatch(List<Object[]> batch) {
        try {
            int[] updateCounts = jdbcTemplate.batchUpdate(
                "INSERT INTO menu (school_pk, menu_date, menu_name, favorite) VALUES (?, ?, ?, ?)",
                batch
            );
            
            // 실제 삽입된 레코드 수 계산
            int inserted = 0;
            for (int count : updateCounts) {
                if (count > 0) {
                    inserted += count;
                }
            }
            return inserted;
            
        } catch (DataAccessException e) {
            log.error("배치 실행 중 데이터베이스 오류: {}", e.getMessage());
            return 0;
        }
    }
} 