package com.ssafy.baperang.domain.user.service;

import com.ssafy.baperang.domain.user.dto.request.LoginRequestDto;
import com.ssafy.baperang.domain.user.dto.request.SignupRequestDto;

import jakarta.servlet.http.HttpServletResponse;

public interface UserService {
    public Object signup(SignupRequestDto requestDto);
    public boolean isLoginIdAvailable(String loginId);
    public Object login(LoginRequestDto requestDto, HttpServletResponse response);
    public Object logout(Long userPk, HttpServletResponse response);
    public Object refreshAccessToken(String refreshToken, HttpServletResponse response);
}
