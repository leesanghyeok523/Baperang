package com.ssafy.baperang.domain.user.service;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.ssafy.baperang.domain.user.dto.request.SignupRequestDto;
import com.ssafy.baperang.domain.user.dto.response.SignupResponseDto;
import com.ssafy.baperang.domain.user.entity.User;
import com.ssafy.baperang.domain.user.repository.UserRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor // final로 선언된 필드를 매개변수로 받는 생성자를 자동으로 만듬
public class UserService {

    private final UserRepository userRepository;

    @Transactional // 모든 데이터베이스 작업을 하나의 트랜잭션으로 묶음
    public SignupResponseDto signup(SignupRequestDto requestDto) {
        // SignupRequestDto - 클라이언트에서 받은 데이터 담음
        // SignupResponseDto - 클라이언트에게 돌려줄 응답
        if (userRepository.existsByLoginId(requestDto.getLoginId())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "이미 존재하는 이디입니다.");
        }

        User user = User.builder()
                .loginId(requestDto.getLoginId())
                .password(requestDto.getPassword())
                .nutritionistName(requestDto.getNutritionistName())
                .city(requestDto.getCity())
                .schoolName(requestDto.getSchoolName())
                .build();

        userRepository.saveAndFlush(user); // 만든 User 객체를 DB에 저장

        SignupResponseDto.SignupContent content = SignupResponseDto.SignupContent.builder()
                .loginId(user.getLoginId())
                .nutritionistName(user.getNutritionistName())
                .city(user.getCity())
                .schoolName(user.getSchoolName())
                .build();

        return SignupResponseDto.builder()
                .message("회원가입이 완료 되었습니다.")
                .content(content)
                .build();
    }

    @Transactional(readOnly = true)
    public boolean isLoginIdAvailable(String loginId) {
        return !userRepository.existsByLoginId(loginId);
    }
}