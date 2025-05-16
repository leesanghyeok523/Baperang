package com.ssafy.baperang.domain.inventory.repository;

import com.ssafy.baperang.domain.inventory.entity.Inventory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;

public interface InventoryJpaRepository extends JpaRepository<Inventory, Long> {

    // 특정 월의 재고 데이터 조회
    @Query("SELECT i FROM Inventory i WHERE YEAR(i.inventoryDate) = :year AND MONTH(i.inventoryDate) = :month ORDER BY i.inventoryDate DESC")
    List<Inventory> findByMonth(@Param("year") int year, @Param("month") int month);
}
