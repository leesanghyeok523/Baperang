package com.ssafy.baperang.domain.menunutrient.repository;

import com.ssafy.baperang.domain.menu.entity.Menu;
import com.ssafy.baperang.domain.menunutrient.entity.MenuNutrient;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface MenuNutrientJpaRepository extends JpaRepository<MenuNutrient, MenuNutrient.MenuNutrientId> {
    MenuNutrient findByMenuIdAndNutrientId(Long menuId, Long nutrientId);
    List<MenuNutrient> findByMenuId(Long menuId);
    List<MenuNutrient> findByMenu(Menu menu);
}
