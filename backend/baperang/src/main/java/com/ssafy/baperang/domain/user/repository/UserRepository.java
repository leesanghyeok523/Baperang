package com.ssafy.baperang.domain.user.repository;

import com.ssafy.baperang.domain.user.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    // 로그인 아이디 중복만 체크
    boolean existsByLoginId(String loginId);
}