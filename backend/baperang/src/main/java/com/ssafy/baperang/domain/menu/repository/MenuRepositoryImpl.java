package com.ssafy.baperang.domain.menu.repository;

import java.time.LocalDate;
import java.util.List;

import org.springframework.stereotype.Repository;
import lombok.RequiredArgsConstructor;

import com.ssafy.baperang.domain.menu.entity.Menu;
import com.ssafy.baperang.domain.school.entity.School;
import com.ssafy.baperang.domain.menu.repository.MenuJpaRepository;

@Repository
@RequiredArgsConstructor
public class MenuRepositoryImpl implements MenuRepository {

    private final MenuJpaRepository menuJpaRepository;
    
    @Override
    public Menu saveAndFlush(Menu menu) {
        return menuJpaRepository.saveAndFlush(menu);
    }


    @Override
    public List<Menu> findByMenuDate(LocalDate menuDate) {
        return menuJpaRepository.findByMenuDate(menuDate);
    }

    @Override
    public List<Menu> findBySchool(School school) {
        return menuJpaRepository.findBySchool(school);
    }

    @Override
    public List<Menu> findBySchoolAndMenuDateBetweenOrderByMenuDate(School school, LocalDate startDate, LocalDate endDate) {
        return menuJpaRepository.findBySchoolAndMenuDateBetweenOrderByMenuDate(school, startDate, endDate);
    }

    @Override
    public boolean existsBySchoolAndMenuDateAndMenuName(School school, LocalDate menuDate, String menuName) {
        return menuJpaRepository.existsBySchoolAndMenuDateAndMenuName(school, menuDate, menuName);
    }
    
    @Override
    public List<String> findDistinctMenuNamesBySchoolAndMenuDate(School school, LocalDate menuDate) {
        return menuJpaRepository.findDistinctMenuNamesBySchoolAndMenuDate(school, menuDate);
    }
}
