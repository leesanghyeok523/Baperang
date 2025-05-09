package com.ssafy.baperang.domain.menu.repository;

import java.time.LocalDate;
import java.util.List;

import com.ssafy.baperang.domain.menu.entity.Menu;
import com.ssafy.baperang.domain.school.entity.School;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface MenuJpaRepository extends JpaRepository<Menu, Long> {

    Menu saveAndFlush(Menu menu);
    // 날짜로 잔반율 조회
    List<Menu> findByMenuDate(LocalDate menuDate);

    // 학교별 메뉴 조회
    List<Menu> findBySchool(School school);

    List<Menu> findBySchoolAndMenuDateBetweenOrderByMenuDate(
            School school,
            LocalDate startDate,
            LocalDate endDate
    );

    // 특정 날짜의 메뉴 이름 목록 조회 (잔반율 서비스에서 활용 가능)
    @Query("SELECT DISTINCT m.menuName FROM Menu m WHERE m.school = :school AND m.menuDate = :date")
    List<String> findDistinctMenuNamesBySchoolAndMenuDate(
            @Param("school") School school,
            @Param("date") LocalDate date
    );

    boolean existsBySchoolAndMenuDateAndMenuName(
            School school,
            LocalDate menuDate,
            String menuName
    );
    
    // 특정 학교, 날짜, 메뉴명으로 메뉴 조회
    Menu findBySchoolAndMenuDateAndMenuName(
            School school,
            LocalDate menuDate,
            String menuName
    );
    
    // 특정 학교, 날짜의 모든 메뉴 조회
    List<Menu> findBySchoolAndMenuDate(
            School school,
            LocalDate menuDate
    );
    
    // 특정 학교의 메뉴를 날짜 기준 내림차순으로 조회 (최신 메뉴부터)
    List<Menu> findBySchoolOrderByMenuDateDesc(School school);
}
