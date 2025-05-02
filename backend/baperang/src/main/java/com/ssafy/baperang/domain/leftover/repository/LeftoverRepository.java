package com.ssafy.baperang.domain.leftover.repository;

import com.ssafy.baperang.domain.leftover.dto.response.LeftoverDateResponseDto;
import com.ssafy.baperang.domain.leftover.entity.Leftover;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface LeftoverRepository extends JpaRepository<Leftover, Long> {

    // 특정 날짜 메뉴별 평균 잔반율 조회 (JPQL 사용)
    @Query("SELECT new com.ssafy.baperang.domain.leftover.dto.response.LeftoverDateResponseDto$MenuLeftoverRate(l.leftMenuName, AVG(l.leftoverRate)) " +
            "FROM Leftover l " +
            "WHERE l.leftoverDate = :date " +
            "GROUP BY l.leftMenuName")

    List<LeftoverDateResponseDto.MenuLeftoverRate> findAverageLeftoverRateByDate(@Param("date") LocalDate date);
}
