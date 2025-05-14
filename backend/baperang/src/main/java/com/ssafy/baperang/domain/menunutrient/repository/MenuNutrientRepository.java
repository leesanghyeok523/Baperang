package com.ssafy.baperang.domain.menunutrient.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.ssafy.baperang.domain.menu.entity.Menu;
import com.ssafy.baperang.domain.menunutrient.entity.MenuNutrient;

@Repository
public interface MenuNutrientRepository extends JpaRepository<MenuNutrient, MenuNutrient.MenuNutrientId> {

    /**
     * 메뉴 ID로 영양소 정보 조회
     * @param menuId 메뉴 ID
     * @return 해당 메뉴의 영양소 정보 목록
     */
    List<MenuNutrient> findByMenuId(Long menuId);

    /**
     * Menu 엔티티로 영양소 정보 조회
     * @param menu 메뉴 엔티티
     * @return 해당 메뉴의 영양소 정보 목록
     */
    List<MenuNutrient> findByMenu(Menu menu);

    MenuNutrient findByMenuIdAndNutrientId(Long menuId, Long nutrientId);
}
