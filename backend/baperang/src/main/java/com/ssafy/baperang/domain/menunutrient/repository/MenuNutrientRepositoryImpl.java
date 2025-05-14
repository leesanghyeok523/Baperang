package com.ssafy.baperang.domain.menunutrient.repository;

import com.ssafy.baperang.domain.menunutrient.entity.MenuNutrient;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
@RequiredArgsConstructor
public class MenuNutrientRepositoryImpl implements MenuNutrientRepository {

    private final MenuNutrientJpaRepository menuNutrientJpaRepository;

    @Override
    public MenuNutrient save(MenuNutrient menuNutrient) {
        return menuNutrientJpaRepository.save(menuNutrient);
    }

    @Override
    public List<MenuNutrient> findAll() {
        return menuNutrientJpaRepository.findAll();
    }

    @Override
    public MenuNutrient findByMenuIdAndNutrientId(Long menuId, Long nutrientId) {
        return menuNutrientJpaRepository.findByMenuIdAndNutrientId(menuId, nutrientId);
    }

    // 추가 메서드 구현
}