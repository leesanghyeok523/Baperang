package com.ssafy.baperang.domain.satisfaction.service;

import java.io.IOException;
import java.util.Map;
import java.util.HashMap;
import java.util.List;
import java.util.ArrayList;
import java.util.concurrent.ConcurrentHashMap;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.text.DecimalFormat;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;

import org.springframework.stereotype.Service;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import com.ssafy.baperang.domain.satisfaction.dto.response.SatisfactionResponseDto;
import com.ssafy.baperang.domain.satisfaction.dto.response.SatisfactionResponseDto.MenuSatisfactionDto;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import com.ssafy.baperang.domain.school.entity.School;
import com.ssafy.baperang.domain.menu.entity.Menu;
import com.ssafy.baperang.domain.school.repository.SchoolRepository;
import com.ssafy.baperang.domain.menu.repository.MenuRepository;
import com.ssafy.baperang.global.jwt.JwtService;
import com.ssafy.baperang.global.exception.BaperangErrorCode;
import com.ssafy.baperang.global.exception.BaperangCustomException;

import jakarta.transaction.Transactional;
import jakarta.persistence.EntityNotFoundException;
import jakarta.annotation.PostConstruct;
import jakarta.annotation.PreDestroy;

@Slf4j
@Service
@RequiredArgsConstructor
public class SatisfactionServiceImpl implements SatisfactionService {

    private final SchoolRepository schoolRepository;
    private final MenuRepository menuRepository;
    private final JwtService jwtService;
    // 모든 SSE 이벤트 Emitter를 저장하는 맵 (동시성 처리를 위해 ConcurrentHashMap 사용)
    private final Map<String, SseEmitter> emitters = new ConcurrentHashMap<>();

    // 각 Emitter 유효 시간 (1시간)
    private static final long SSE_TIMEOUT = 60 * 60 * 1000L;
    
    // 하트비트 주기 (21초)
    private static final long HEARTBEAT_INTERVAL = 21;
    
    // 하트비트를 위한 스케줄러
    private ScheduledExecutorService heartbeatScheduler;
    
    @PostConstruct
    public void init() {
        this.heartbeatScheduler = Executors.newSingleThreadScheduledExecutor();
        this.heartbeatScheduler.scheduleAtFixedRate(this::sendHeartbeat, HEARTBEAT_INTERVAL, HEARTBEAT_INTERVAL, TimeUnit.SECONDS);
        log.info("하트비트 스케줄러 초기화 완료 ({}초 간격)", HEARTBEAT_INTERVAL);
    }
    
    @PreDestroy
    public void destroy() {
        if (this.heartbeatScheduler != null) {
            this.heartbeatScheduler.shutdown();
            log.info("하트비트 스케줄러 종료");
        }
    }
    
    /**
     * 모든 연결된 클라이언트에게 하트비트 이벤트를 전송
     */
    private void sendHeartbeat() {
        log.debug("하트비트 이벤트 전송 중... (현재 연결 수: {})", emitters.size());
        
        emitters.forEach((id, emitter) -> {
            try {
                emitter.send(SseEmitter.event()
                        .name("heartbeat")
                        .data(LocalDateTime.now().toString()));
            } catch (IOException e) {
                log.error("하트비트 전송 실패 (id: {}): {}", id, e.getMessage());
                emitters.remove(id);
            }
        });
    }

    /**
     * 오늘의 메뉴 만족도 정보를 조회하여 반환
     */
    private List<MenuSatisfactionDto> getTodayMenuSatisfactions(String schoolName) {
        LocalDate today = LocalDate.now();
        log.info("메뉴 만족도 조회: 오늘 날짜 = {}", today);
        
        // 학교 조회 시도
        School school = schoolRepository.findBySchoolName(schoolName)
            .orElseThrow(() -> new EntityNotFoundException("학교를 찾을 수 없습니다: " + schoolName));

        List<String> menuNames = menuRepository.findDistinctMenuNamesBySchoolAndMenuDate(school, today);
        
        List<MenuSatisfactionDto> menuSatisfactions = new ArrayList<>();
        
        DecimalFormat df = new DecimalFormat("#.##");
        for (String menuName : menuNames) {
            Menu menuItem = menuRepository.findBySchoolAndMenuDateAndMenuName(school, today, menuName);
            int votes = menuItem.getVoteCount();
            double avgSatisfaction = (votes > 0) ? (double) menuItem.getTotalFavorite() / votes : 0;
            String formattedAvg = df.format(avgSatisfaction);
            
            MenuSatisfactionDto menuDto = MenuSatisfactionDto.builder()
                .menuId(menuItem.getId())
                .menuName(menuItem.getMenuName())
                .averageSatisfaction(formattedAvg)
                .build();
            menuSatisfactions.add(menuDto);
        }
        
        log.info("조회된 메뉴 수: {}", menuSatisfactions.size());
        return menuSatisfactions;
    }

    // SSE 구독 처리
    @Override
    public SseEmitter subscribe(String token, String schoolName) {

        // 토큰 유효성
        if (!jwtService.validateToken(token)) {
            log.info("subscribe - 토큰 유효하지 않음");
            throw new BaperangCustomException(BaperangErrorCode.INVALID_TOKEN);
        }

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
            emitter.send(SseEmitter.event().name("connect").data("SSE 연결됨!"));
            
            // 초기 연결 시 오늘의 메뉴 만족도 정보 전송
            List<MenuSatisfactionDto> menuSatisfactions = getTodayMenuSatisfactions(schoolName);
            emitter.send(SseEmitter.event()
                    .name("initial-satisfaction")
                    .data(menuSatisfactions));
            
            log.info("초기 메뉴 만족도 데이터 전송 완료 (메뉴 수: {})", menuSatisfactions.size());
        } catch (IOException e) {
            log.error("SSE 연결 중 에러 발생: {}", e.getMessage(), e);
            emitters.remove(emitterId);
        }

        return emitter;
    }

    @Transactional
    @Override
    public SatisfactionResponseDto processVote(String token, String schoolName, String menuName, int satisfactionScore) {

        // 토큰 유효성
        if (!jwtService.validateToken(token)) {
            log.info("subscribe - 토큰 유효하지 않음");
            throw new BaperangCustomException(BaperangErrorCode.INVALID_TOKEN);
        }

        log.info("만족도 투표 처리: 학교={}, 메뉴={}, 점수={}", schoolName, menuName, satisfactionScore);
        
        // 1. 학교 조회
        School school = schoolRepository.findBySchoolName(schoolName)
            .orElseThrow(() -> new EntityNotFoundException("학교를 찾을 수 없습니다: " + schoolName));
        
        // 2. 오늘 날짜의 메뉴 목록 조회
        LocalDate today = LocalDate.now();
        // LocalDate today = LocalDate.of(2025, 4, 29);
        List<String> menuNames = menuRepository.findDistinctMenuNamesBySchoolAndMenuDate(school, today);
        
        // 3. 메뉴 이름이 목록에 있는지 확인
        if (!menuNames.contains(menuName)) {
            log.info("DB에서 조회된 메뉴 목록: {}", menuNames);
            log.info("요청으로 들어온 메뉴명: '{}'", menuName);
            throw new EntityNotFoundException("오늘의 메뉴에서 해당 메뉴를 찾을 수 없습니다: " + menuName);
        }
        
        // 4. 특정 메뉴 조회
        Menu menu = menuRepository.findBySchoolAndMenuDateAndMenuName(school, today, menuName);
        if (menu == null) {
            throw new EntityNotFoundException("해당 메뉴 정보를 찾을 수 없습니다: " + menuName);
        }

        // 5. 만족도 데이터 업데이트
        menu.addVote(satisfactionScore);
        menuRepository.saveAndFlush(menu);
        
        log.info("메뉴 만족도 업데이트 완료: id={}, votes={}, favorite={}", 
                 menu.getId(), menu.getVoteCount(), menu.getFavorite());
        
        // 6. 업데이트된 메뉴 정보 준비
        int totalVotes = menu.getVoteCount();
        int totalFavorite = menu.getTotalFavorite();
        double averageSatisfaction = (totalVotes > 0) ? (double) totalFavorite / totalVotes : 0;
        
        // 소수점 두 자리까지 포맷팅
        DecimalFormat df = new DecimalFormat("#.##");
        String formattedAverage = df.format(averageSatisfaction);
        
        // 7. 해당 날짜의 모든 메뉴 정보 조회
        List<Menu> allMenus = menuRepository.findBySchoolAndMenuDate(school, today);
        List<MenuSatisfactionDto> menuSatisfactions = new ArrayList<>();
        
        for (Menu menuItem : allMenus) {
            int votes = menuItem.getVoteCount();
            double avgSatisfaction = (votes > 0) ? (double) menuItem.getTotalFavorite() / votes : 0;
            String formattedAvg = df.format(avgSatisfaction);
            
            MenuSatisfactionDto menuDto = MenuSatisfactionDto.builder()
                .menuId(menuItem.getId())
                .menuName(menuItem.getMenuName())
                .averageSatisfaction(formattedAvg)
                .build();
            menuSatisfactions.add(menuDto);
        }
        
        // SSE로 전체 메뉴 만족도 정보 전송
        emitters.forEach((id, emitter) -> {
            try {
                emitter.send(SseEmitter.event()
                        .name("satisfaction-update")
                        .data(menuSatisfactions));
                log.info("SSE 이벤트 전송 성공: {}", id);
            } catch (IOException e) {
                log.error("SSE 전송 실패: {}", e.getMessage());
                emitters.remove(id);
            }
        });
        
        // 8. 응답 데이터 생성
        SatisfactionResponseDto responseDto = SatisfactionResponseDto.builder()
                .allMenuSatisfactions(menuSatisfactions)
                .build();
        
        return responseDto;
    }
}