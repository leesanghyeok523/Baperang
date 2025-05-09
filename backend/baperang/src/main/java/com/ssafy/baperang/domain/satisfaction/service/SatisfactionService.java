package com.ssafy.baperang.domain.satisfaction.service;

import com.ssafy.baperang.domain.satisfaction.dto.SatisfactionRequestDto;
import com.ssafy.baperang.domain.satisfaction.dto.SatisfactionResponseDto;
import com.ssafy.baperang.domain.satisfaction.entity.MenuSatisfaction;
import com.ssafy.baperang.domain.satisfaction.entity.Satisfaction;
import com.ssafy.baperang.domain.satisfaction.repository.SatisfactionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class SatisfactionService {

    private final SatisfactionRepository satisfactionRepository;
    
    // 모든 SSE 이벤트 Emitter를 저장하는 맵 (동시성 처리를 위해 ConcurrentHashMap 사용)
    private final Map<String, SseEmitter> emitters = new ConcurrentHashMap<>();
    
    // 각 Emitter 유효 시간 (1시간)
    private static final long SSE_TIMEOUT = 60 * 60 * 1000L;
    
    @Transactional
    public void saveSatisfaction(SatisfactionRequestDto requestDto) {
        // 만족도 엔티티 생성
        Satisfaction satisfaction = Satisfaction.builder()
                .date(requestDto.getDate())
                .totalVotes(requestDto.getTotalVotes())
                .build();
        
        // 메뉴별 만족도 데이터 설정
        requestDto.getData().forEach(menuDto -> {
            MenuSatisfaction menuSatisfaction = MenuSatisfaction.builder()
                    .menuId(menuDto.getMenuId())
                    .menuName(menuDto.getName())
                    .votes(menuDto.getVotes())
                    .satisfactionRate(menuDto.getAverageSatisfaction())
                    .build();
            satisfaction.addMenuSatisfaction(menuSatisfaction);
        });
        
        // 저장
        satisfactionRepository.save(satisfaction);
        
        // 저장 후 SSE 이벤트 발생시키기
        SatisfactionResponseDto responseDto = entityToDto(satisfaction);
        sendToAllClients(responseDto);
    }
    
    @Transactional(readOnly = true)
    public List<SatisfactionResponseDto> getRecentSatisfactions() {
        // 최근 만족도 조사 데이터 조회 (최대 10개)
        List<Satisfaction> satisfactions = satisfactionRepository.findTop10ByOrderByCreatedAtDesc();
        return satisfactions.stream()
                .map(this::entityToDto)
                .collect(Collectors.toList());
    }
    
    // SSE 구독 처리
    public SseEmitter subscribe() {
        // 고유 ID 생성 (타임스탬프 + 랜덤 값)
        String emitterId = System.currentTimeMillis() + "_" + Math.random();
        
        // SseEmitter 객체 생성
        SseEmitter emitter = new SseEmitter(SSE_TIMEOUT);
        emitters.put(emitterId, emitter);
        
        // SseEmitter가 완료, 타임아웃, 에러 발생 시 맵에서 제거
        emitter.onCompletion(() -> emitters.remove(emitterId));
        emitter.onTimeout(() -> emitters.remove(emitterId));
        emitter.onError(e -> {
            log.error("SSE 에러 발생: {}", e.getMessage(), e);
            emitters.remove(emitterId);
        });
        
        // 최초 연결 시 더미 이벤트 전송 (연결 유지 목적)
        try {
            emitter.send(SseEmitter.event().name("connect").data("Connected!"));
        } catch (IOException e) {
            log.error("SSE 연결 중 에러 발생: {}", e.getMessage(), e);
            emitters.remove(emitterId);
        }
        
        return emitter;
    }
    
    // 모든 클라이언트에게 만족도 데이터 전송
    private void sendToAllClients(SatisfactionResponseDto satisfactionDto) {
        List<String> deadEmitters = new ArrayList<>();
        
        emitters.forEach((id, emitter) -> {
            try {
                emitter.send(SseEmitter.event()
                        .name("satisfaction-update")
                        .data(satisfactionDto));
            } catch (IOException e) {
                log.error("SSE 데이터 전송 중 에러 발생: {}", e.getMessage(), e);
                deadEmitters.add(id);
            }
        });
        
        // 에러가 발생한 Emitter 제거
        deadEmitters.forEach(emitters::remove);
    }
    
    // Entity -> DTO 변환
    private SatisfactionResponseDto entityToDto(Satisfaction satisfaction) {
        List<SatisfactionResponseDto.MenuSatisfactionResponseDto> menuDtos = 
                satisfaction.getMenuSatisfactions().stream()
                        .map(menu -> SatisfactionResponseDto.MenuSatisfactionResponseDto.builder()
                                .menuId(menu.getMenuId())
                                .name(menu.getMenuName())
                                .votes(menu.getVotes())
                                .satisfactionRate(menu.getSatisfactionRate())
                                .build())
                        .collect(Collectors.toList());
        
        return SatisfactionResponseDto.builder()
                .id(satisfaction.getId())
                .date(satisfaction.getDate())
                .createdAt(satisfaction.getCreatedAt())
                .menuSatisfactions(menuDtos)
                .totalVotes(satisfaction.getTotalVotes())
                .build();
    }
} 