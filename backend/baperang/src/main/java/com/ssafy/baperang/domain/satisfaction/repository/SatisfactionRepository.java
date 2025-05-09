package com.ssafy.baperang.domain.satisfaction.repository;

import com.ssafy.baperang.domain.satisfaction.entity.Satisfaction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SatisfactionRepository extends JpaRepository<Satisfaction, Long> {
    List<Satisfaction> findTop10ByOrderByCreatedAtDesc();
} 