package com.ssafy.baperang.domain.user.service;

import com.ssafy.baperang.domain.school.entity.School;
import com.ssafy.baperang.domain.school.repository.SchoolRepository;
import com.ssafy.baperang.domain.user.dto.request.LoginRequestDto;
import com.ssafy.baperang.domain.user.dto.request.SignupRequestDto;
import com.ssafy.baperang.domain.user.dto.response.ErrorResponseDto;
import com.ssafy.baperang.domain.user.dto.response.LoginResponseDto;
import com.ssafy.baperang.domain.user.dto.response.SignupResponseDto;
import com.ssafy.baperang.domain.user.entity.User;
import com.ssafy.baperang.domain.user.repository.UserRepository;
import com.ssafy.baperang.global.exception.BaperangErrorCode;

import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final SchoolRepository schoolRepository;
    private final BCryptPasswordEncoder bCryptPasswordEncoder;

    @Transactional
    public Object signup(SignupRequestDto requestDto) {
        // 중복 ID 검사
        if (userRepository.existsByLoginId(requestDto.getLoginId())) {
            return ErrorResponseDto.of(BaperangErrorCode.DUPLICATE_USER);
        }

        try {
            School school = schoolRepository.findBySchoolNameAndCity(
                            requestDto.getSchoolName(), requestDto.getCity())
                    .orElseGet(() -> {
                        School newSchool = School.builder()
                                .schoolName(requestDto.getSchoolName())
                                .city(requestDto.getCity())
                                .build();
                        return schoolRepository.save(newSchool);
                    });

            String encodedPassword = bCryptPasswordEncoder.encode(requestDto.getPassword());

            User user = User.builder()
                    .loginId(requestDto.getLoginId())
                    .password(encodedPassword)
                    .nutritionistName(requestDto.getNutritionistName())
                    .school(school)
                    .build();

            userRepository.saveAndFlush(user);

            SignupResponseDto.SignupContent content = SignupResponseDto.SignupContent.builder()
                    .loginId(user.getLoginId())
                    .nutritionistName(user.getNutritionistName())
                    .city(user.getSchool().getCity())
                    .schoolName(user.getSchool().getSchoolName())
                    .build();

            return SignupResponseDto.builder()
                    .message("회원가입이 완료 되었습니다.")
                    .content(content)
                    .build();
        } catch (Exception e) {
            // 예외 발생 시 서버 내부 오류로 처리
            return ErrorResponseDto.of(BaperangErrorCode.INTERNAL_SERVER_ERROR);
        }
    }

    @Transactional(readOnly = true)
    public boolean isLoginIdAvailable(String loginId) {
        return !userRepository.existsByLoginId(loginId);
    }

    @Transactional(readOnly = true)
    public Object login(LoginRequestDto requestDto) {
        // 로그인 ID 확인
        User user = userRepository.findByLoginId(requestDto.getLoginId())
                .orElse(null);

        // 사용자를 찾지 못한 경우
        if (user == null) {
            return ErrorResponseDto.of(BaperangErrorCode.INVALID_LOGIN_VALUE);
        }

        // 비밀번호 확인
        if (!bCryptPasswordEncoder.matches(requestDto.getPassword(), user.getPassword())) {
            return ErrorResponseDto.of(BaperangErrorCode.INVALID_LOGIN_VALUE);
        }

        // 성공 시 로그인 응답 반환
        return LoginResponseDto.builder()
                .userPk(user.getId())
                .build();
    }
}