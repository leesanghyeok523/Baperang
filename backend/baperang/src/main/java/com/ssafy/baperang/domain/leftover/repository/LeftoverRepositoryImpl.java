package com.ssafy.baperang.domain.leftover.repository;

import com.ssafy.baperang.domain.leftover.dto.response.LeftoverDateResponseDto;
import com.ssafy.baperang.domain.leftover.entity.Leftover;
import com.ssafy.baperang.domain.student.entity.Student;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
@RequiredArgsConstructor
public class LeftoverRepositoryImpl implements LeftoverRepository {

    private final LeftoverJpaRepository leftoverJpaRepository;

    @Override
    public Leftover save(Leftover leftover) {
        return leftoverJpaRepository.save(leftover);
    }

    @Override
    public List<LeftoverDateResponseDto.MenuLeftoverRate> findAverageLeftoverRateByDate(LocalDate date) {
        return leftoverJpaRepository.findAverageLeftoverRateByDate(date);
    }

    @Override
    public List<Leftover> findByYearAndMonth(int year, int month) {
        return leftoverJpaRepository.findByYearAndMonth(year, month);
    }

    @Override
    public List<Leftover> findByStudentAndLeftoverDate(Student student, LocalDate leftoverDate) {
        return leftoverJpaRepository.findByStudentAndLeftoverDate(student, leftoverDate);
    }
}