package com.ssafy.baperang.domain.satisfaction.service;

import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;
import com.ssafy.baperang.domain.satisfaction.dto.response.SatisfactionResponseDto;

public interface SatisfactionService {
    /**
     * SSE 연결을 위한 구독 메서드
     * 클라이언트의 SSE 연결 요청을 처리하고 SseEmitter를 반환
     * @return SseEmitter 객체
     */
    SseEmitter subscribe();

    SatisfactionResponseDto processVote(String schoolName, String menuName, int satisfactionScore);
}
