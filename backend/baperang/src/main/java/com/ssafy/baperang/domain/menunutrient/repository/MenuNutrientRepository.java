package com.ssafy.baperang.domain.menunutrient.repository;

import com.ssafy.baperang.domain.menunutrient.entity.MenuNutrient;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MenuNutrientRepository {
    // 기본 CRUD 메서드
    MenuNutrient save(MenuNutrient menuNutrient);
    List<MenuNutrient> findAll();

    // 커스텀 쿼리 메서드
    MenuNutrient findByMenuIdAndNutrientId(Long menuId, Long nutrientId);

    // 추가로 필요한 비즈니스 메서드가 있으면 여기에 선언
}