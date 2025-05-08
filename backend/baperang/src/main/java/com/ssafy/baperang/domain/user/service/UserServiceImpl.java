package com.ssafy.baperang.domain.user.service;

import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.ssafy.baperang.domain.school.entity.School;
import com.ssafy.baperang.domain.school.repository.SchoolRepository;
import com.ssafy.baperang.domain.user.dto.request.LoginRequestDto;
import com.ssafy.baperang.domain.user.dto.request.SignupRequestDto;
import com.ssafy.baperang.domain.user.dto.response.ErrorResponseDto;
import com.ssafy.baperang.domain.user.dto.response.LoginResponseDto;
import com.ssafy.baperang.domain.user.dto.response.LogoutResponseDto;
import com.ssafy.baperang.domain.user.dto.response.SignupResponseDto;
import com.ssafy.baperang.domain.user.entity.User;
import com.ssafy.baperang.domain.user.repository.UserRepository;
import com.ssafy.baperang.global.exception.BaperangErrorCode;
import com.ssafy.baperang.global.jwt.JwtService;

import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
@RequiredArgsConstructor
public class UserServiceImpl implements UserService{

    private final UserRepository userRepository;
    private final SchoolRepository schoolRepository;
    private final BCryptPasswordEncoder bCryptPasswordEncoder;
    private final JwtService jwtService;

    @Transactional
    public Object signup(SignupRequestDto requestDto) {
        log.info("signup 함수 실행");
        // 중복 ID 검사
        if (userRepository.existsByLoginId(requestDto.getLoginId())) {
            return ErrorResponseDto.of(BaperangErrorCode.DUPLICATE_USER);
        }

        try {
            School school = schoolRepository.findBySchoolNameAndCity(
                            requestDto.getSchoolName(), requestDto.getCity())
                    .orElseGet(() -> {
                        log.info("signup() - 새 학교 생성");
                        School newSchool = School.builder()
                                .schoolName(requestDto.getSchoolName())
                                .city(requestDto.getCity())
                                .schoolType(requestDto.getSchoolType())
                                .build();
                        return schoolRepository.saveAndFlush(newSchool);
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

            log.info("signup() 함수 성공 종료");
            return SignupResponseDto.builder()
                    .message("회원가입이 완료 되었습니다.")
                    .content(content)
                    .build();
        } catch (Exception e) {
            log.info("signup 함수 예외 발생: {}", e.getMessage());
            // 예외 발생 시 서버 내부 오류로 처리
            return ErrorResponseDto.of(BaperangErrorCode.INTERNAL_SERVER_ERROR);
        }
    }

    @Transactional(readOnly = true)
    public boolean isLoginIdAvailable(String loginId) {
        log.info("isLoginIdAvailable 실행");
        boolean result = !userRepository.existsByLoginId(loginId);
        log.info("isLoginIdAvailable 종료");
        return result;
    }

    @Transactional(readOnly = true)
    public Object login(LoginRequestDto requestDto, HttpServletResponse response) {
        log.info("login 함수 실행");
        // 로그인 ID 확인
        User user = userRepository.findByLoginId(requestDto.getLoginId())
                .orElse(null);

        // 사용자를 찾지 못한 경우
        if (user == null) {
            log.info("login() - 사용자 없음");
            return ErrorResponseDto.of(BaperangErrorCode.INVALID_LOGIN_VALUE);
        }

        // 비밀번호 확인
        if (!bCryptPasswordEncoder.matches(requestDto.getPassword(), user.getPassword())) {
            log.info("login - 비밀번호 불일치");
            return ErrorResponseDto.of(BaperangErrorCode.INVALID_LOGIN_VALUE);
        }

        // JWT 토큰 생성 (userId 포함)
        String accessToken = jwtService.createAccessToken(user.getLoginId(), user.getId());
        String refreshToken = jwtService.createRefreshToken(user.getLoginId(), user.getId());
        
        // Access Token을 헤더에 추가
        response.setHeader("Authorization", "Bearer " + accessToken);
        
        // Refresh Token을 쿠키에 추가
        Cookie refreshTokenCookie = new Cookie("refreshToken", refreshToken);
        refreshTokenCookie.setHttpOnly(true);
        refreshTokenCookie.setSecure(true); // HTTPS에서만 전송
        refreshTokenCookie.setPath("/");
        refreshTokenCookie.setMaxAge(7 * 24 * 60 * 60); // 7일간 유효
        response.addCookie(refreshTokenCookie);

        log.info("login 함수 성공 종료");
        
        // 성공 시 빈 응답 본문 반환 (필요한 정보는 모두 토큰에 있음)
        return new LoginResponseDto();
    }

    @Transactional
    public Object logout(String token, HttpServletResponse response) {
        log.info("logout 함수 실행");

        // 토큰 유효성 검사
        if (!jwtService.validateToken(token)) {
            log.info("logout - 토큰 유효하지 않음");
            return ErrorResponseDto.of(BaperangErrorCode.INVALID_TOKEN);
        }

        Long userPk = jwtService.getUserId(token);

        // 사용자 존재 여부 확인
        User user = userRepository.findById(userPk)
                .orElse(null);

        if (user == null) {
            log.info("logout - 사용자 없음");
            return ErrorResponseDto.of(BaperangErrorCode.USER_NOT_FOUND);
        }
        try {
            // 쿠키 삭제
            Cookie cookie = new Cookie("refreshToken", null);
            cookie.setMaxAge(0);
            cookie.setPath("/");
            cookie.setHttpOnly(true);
            cookie.setSecure(true); // HTTPS에서만 전송
            response.addCookie(cookie);

            // 성공 응답 반환
            return LogoutResponseDto.builder()
                    .message("로그아웃이 완료되었습니다.")
                    .build();
        } catch (Exception e) {
            return ErrorResponseDto.of(BaperangErrorCode.INTERNAL_SERVER_ERROR);
        }
    }
    
    @Transactional(readOnly = true)
    public Object refreshAccessToken(String refreshToken, HttpServletResponse response) {
        log.info("refreshAccessToken 함수 실행");
        
        // refreshToken 검증
        if (!jwtService.validateToken(refreshToken)) {
            log.info("refreshAccessToken - 리프레시 토큰 유효하지 않음");
            return ErrorResponseDto.of(BaperangErrorCode.INVALID_REFRESH_TOKEN);
        }
        
        // 토큰에서 loginId와 userId 추출
        String loginId = jwtService.getLoginId(refreshToken);
        Long userId = jwtService.getUserId(refreshToken);
        
        // 사용자 존재 확인
        User user = userRepository.findByLoginId(loginId)
                .orElse(null);
                
        if (user == null) {
            log.info("refreshAccessToken - 사용자 없음");
            return ErrorResponseDto.of(BaperangErrorCode.USER_NOT_FOUND);
        }
        
        // 새 accessToken 발급 (userId 포함)
        String newAccessToken = jwtService.createAccessToken(loginId, userId);
        
        // 응답 헤더에 새 액세스 토큰 추가
        response.setHeader("Authorization", "Bearer " + newAccessToken);
        
        log.info("refreshAccessToken 함수 성공 종료");
        // 빈 응답 본문 반환
        return new LoginResponseDto();
    }
}
