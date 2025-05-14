package com.ssafy.baperang.domain.menunutrient.repository;

import com.ssafy.baperang.domain.menunutrient.entity.MenuNutrient;
import org.springframework.data.jpa.repository.JpaRepository;

public interface MenuNutrientJpaRepository extends JpaRepository<MenuNutrient, MenuNutrient.MenuNutrientId> {
    MenuNutrient findByMenuIdAndNutrientId(Long menuId, Long nutrientId);
}
