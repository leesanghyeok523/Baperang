package com.ssafy.baperang.domain.school.repository;

import com.ssafy.baperang.domain.school.entity.School;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface SchoolRepository extends JpaRepository<School, Long> {
    Optional<School> findBySchoolNameAndCity(String schoolName, String city);
    boolean existsBySchoolNameAndCity(String schoolName, String city);
}
