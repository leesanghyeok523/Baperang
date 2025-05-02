package com.ssafy.baperang.domain.user.service;

import com.ssafy.baperang.domain.user.dto.request.LoginRequestDto;
import com.ssafy.baperang.domain.user.dto.request.SignupRequestDto;

public interface UserService {
    public Object signup(SignupRequestDto requestDto);
    public boolean isLoginIdAvailable(String loginId);
    public Object login(LoginRequestDto requestDto);
    public Object logout(Long userPk);
}
