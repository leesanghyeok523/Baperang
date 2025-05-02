package com.ssafy.baperang.domain.user.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.ssafy.baperang.domain.user.entity.User;


@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    // 로그인 아이디 중복만 체크
    boolean existsByLoginId(String loginId);

    // 로그인 아이디로 사용자 찾기
    Optional<User> findByLoginId(String loginId);
}