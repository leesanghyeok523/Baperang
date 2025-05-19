package com.ssafy.baperang.domain.sse.service;

import java.io.IOException;
import java.text.DecimalFormat;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import com.ssafy.baperang.domain.leftover.dto.response.LeftoverDateResponseDto.MenuLeftoverRate;
import com.ssafy.baperang.domain.leftover.repository.LeftoverRepository;
import com.ssafy.baperang.domain.menu.entity.Menu;
import com.ssafy.baperang.domain.menu.repository.MenuRepository;
import com.ssafy.baperang.domain.school.entity.School;
import com.ssafy.baperang.domain.school.repository.SchoolRepository;
import com.ssafy.baperang.domain.sse.dto.response.LeftoverResponseDto;
import com.ssafy.baperang.domain.sse.dto.response.LeftoverResponseDto.MenuLeftoverDto;
import com.ssafy.baperang.domain.sse.dto.response.SatisfactionResponseDto;
import com.ssafy.baperang.domain.sse.dto.response.SatisfactionResponseDto.MenuSatisfactionDto;
import com.ssafy.baperang.domain.user.entity.User;
import com.ssafy.baperang.domain.user.repository.UserRepository;
import com.ssafy.baperang.global.exception.BaperangCustomException;
import com.ssafy.baperang.global.exception.BaperangErrorCode;
import com.ssafy.baperang.global.jwt.JwtService;

import jakarta.annotation.PostConstruct;
import jakarta.annotation.PreDestroy;
import jakarta.persistence.EntityNotFoundException;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
@RequiredArgsConstructor
public class SseServiceImpl implements SseService {

    private final SchoolRepository schoolRepository;
    private final MenuRepository menuRepository;
    private final UserRepository userRepository;
    private final LeftoverRepository leftoverRepository;
    private final JwtService jwtService;
    // 모든 SSE 이벤트 Emitter를 저장하는 맵 (동시성 처리를 위해 ConcurrentHashMap 사용)
    private final Map<String, SseEmitter> emitters = new ConcurrentHashMap<>();

    // 각 Emitter 유효 시간 (1시간)
    private static final long SSE_TIMEOUT = 60 * 60 * 1000L;
    
    // 하트비트 주기 (10초)
    private static final long HEARTBEAT_INTERVAL = 10;
    
    // 메뉴 최대 표시 개수
    private static final int MAX_MENU_COUNT = 5;
    
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
     * 오늘의 메뉴 만족도 정보를 조회하여 반환 (우선순위와 최대 개수에 따라 필터링)
     */
    private List<MenuSatisfactionDto> getTodayMenuSatisfactions(String schoolName) {
        LocalDate today = LocalDate.now();
        log.info("메뉴 만족도 조회: 오늘 날짜 = {}", today);
        
        // 학교 조회 시도 - 동일한 이름의 학교가 여러 개 있을 수 있으므로 리스트로 조회
        List<School> schools = schoolRepository.findAll().stream()
            .filter(s -> s.getSchoolName().equals(schoolName))
            .collect(Collectors.toList());
            
        if (schools.isEmpty()) {
            throw new EntityNotFoundException("학교를 찾을 수 없습니다: " + schoolName);
        }
        
        // 여러 학교가 있는 경우 첫 번째 항목 사용
        School school = schools.get(0);
        log.info("선택된 학교: ID={}, 이름={}, 도시={}", school.getId(), school.getSchoolName(), school.getCity());

        // 해당 날짜의 모든 메뉴 정보 조회
        List<Menu> allMenus = menuRepository.findBySchoolAndMenuDate(school, today);
        
        return filterMenusByPriority(allMenus);
    }

    /**
     * 메뉴 항목을 카테고리 우선순위에 따라 필터링하고 최대 개수를 제한하는 메서드
     */
    private List<MenuSatisfactionDto> filterMenusByPriority(List<Menu> menus) {
        DecimalFormat df = new DecimalFormat("#.##");
        
        // 메뉴를 카테고리 우선순위에 따라 정렬된 리스트로 변환
        List<MenuSatisfactionDto> sortedMenus = new ArrayList<>();
        
        // 1. rice 카테고리 먼저 추가
        menus.stream()
            .filter(menu -> "rice".equals(menu.getCategory()))
            .forEach(menuItem -> {
                int votes = menuItem.getVoteCount();
                double avgSatisfaction = (votes > 0) ? (double) menuItem.getTotalFavorite() / votes : 0;
                String formattedAvg = df.format(avgSatisfaction);
                
                sortedMenus.add(MenuSatisfactionDto.builder()
                    .menuName(menuItem.getMenuName())
                    .voteCount(votes)
                    .averageSatisfaction(formattedAvg)
                    .build());
            });
            
        // 2. soup 카테고리 추가
        menus.stream()
            .filter(menu -> "soup".equals(menu.getCategory()))
            .forEach(menuItem -> {
                int votes = menuItem.getVoteCount();
                double avgSatisfaction = (votes > 0) ? (double) menuItem.getTotalFavorite() / votes : 0;
                String formattedAvg = df.format(avgSatisfaction);
                
                sortedMenus.add(MenuSatisfactionDto.builder()
                    .menuName(menuItem.getMenuName())
                    .voteCount(votes)
                    .averageSatisfaction(formattedAvg)
                    .build());
            });
            
        // 3. main 카테고리 추가
        menus.stream()
            .filter(menu -> "main".equals(menu.getCategory()))
            .forEach(menuItem -> {
                int votes = menuItem.getVoteCount();
                double avgSatisfaction = (votes > 0) ? (double) menuItem.getTotalFavorite() / votes : 0;
                String formattedAvg = df.format(avgSatisfaction);
                
                sortedMenus.add(MenuSatisfactionDto.builder()
                    .menuName(menuItem.getMenuName())
                    .voteCount(votes)
                    .averageSatisfaction(formattedAvg)
                    .build());
            });
            
        // 4. side 카테고리 추가 (최대 개수 제한)
        int remainingSlots = MAX_MENU_COUNT - sortedMenus.size();
        if (remainingSlots > 0) {
            List<Menu> sideMenus = menus.stream()
                .filter(menu -> "side".equals(menu.getCategory()))
                .limit(remainingSlots)
                .collect(Collectors.toList());
                
            for (Menu menuItem : sideMenus) {
                int votes = menuItem.getVoteCount();
                double avgSatisfaction = (votes > 0) ? (double) menuItem.getTotalFavorite() / votes : 0;
                String formattedAvg = df.format(avgSatisfaction);
                
                sortedMenus.add(MenuSatisfactionDto.builder()
                    .menuName(menuItem.getMenuName())
                    .voteCount(votes)
                    .averageSatisfaction(formattedAvg)
                    .build());
            }
        }
        
        log.info("필터링된 메뉴 수: {}", sortedMenus.size());
        return sortedMenus;
    }

    // SSE 구독 처리
    @Override
    public SseEmitter subscribe(String token) {

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

        Long userPk = jwtService.getUserId(token);
        User user = userRepository.findById(userPk)
                .orElse(null);

        if (user == null) {
            log.info("processLeftoverRate - 사용자 정보 없음");
            throw new BaperangCustomException(BaperangErrorCode.USER_NOT_FOUND);
        }

        School school = user.getSchool();
        String schoolName = school.getSchoolName();

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
        
        // 1. 학교 조회 - 동일한 이름의 학교가 여러 개 있을 수 있으므로 리스트로 조회
        List<School> schools = schoolRepository.findAll().stream()
            .filter(s -> s.getSchoolName().equals(schoolName))
            .collect(Collectors.toList());
            
        if (schools.isEmpty()) {
            throw new EntityNotFoundException("학교를 찾을 수 없습니다: " + schoolName);
        }
        
        // 여러 학교가 있는 경우 첫 번째 항목 사용
        School school = schools.get(0);
        log.info("선택된 학교: ID={}, 이름={}, 도시={}", school.getId(), school.getSchoolName(), school.getCity());
        
        // 2. 오늘 날짜의 메뉴 목록 조회
        LocalDate today = LocalDate.now();
//        LocalDate today = LocalDate.of(2025, 4, 29);
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
        
        // 7. 해당 날짜의 모든 메뉴 정보 조회
        List<Menu> allMenus = menuRepository.findBySchoolAndMenuDate(school, today);
        
        // 카테고리 우선순위에 따라 메뉴 필터링
        List<MenuSatisfactionDto> menuSatisfactions = filterMenusByPriority(allMenus);
        
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

    @Override
    public LeftoverResponseDto processLeftoverRate(Long userPk) {
        // 사용자와 학교 정보 조회
        User user = userRepository.findById(userPk)
                .orElseThrow(() -> new BaperangCustomException(BaperangErrorCode.USER_NOT_FOUND));

        School school = user.getSchool();
        if (school == null) {
            log.info("processLeftoverRate - 학교 정보 없음");
            throw new BaperangCustomException(BaperangErrorCode.SCHOOL_NOT_FOUND);
        }
        
        log.info("잔반율 정보 조회 및 SSE 전송 - 학교: {}", school.getSchoolName());
        LocalDate today = LocalDate.now();
        
        // 해당 학교의 오늘 메뉴 조회
        List<Menu> menus = menuRepository.findBySchoolAndMenuDate(school, today);
        
        if (menus.isEmpty()) {
            log.info("학교 {} - 오늘의 메뉴 정보 없음", school.getSchoolName());
            return LeftoverResponseDto.builder()
                .menuLeftovers(List.of())
                .build();
        }
        
        // 오늘 날짜의 전체 잔반율 정보 조회
        List<MenuLeftoverRate> leftoverRates = leftoverRepository.findAverageLeftoverRateByDate(today);
        log.info("학교 {} - 조회된 잔반율 정보: {} 개", school.getSchoolName(), leftoverRates.size());
        
        // 해당 학교 메뉴와 잔반율 정보 매핑
        List<MenuLeftoverDto> menuLeftovers = menus.stream()
            .map(menu -> {
                // 해당 메뉴의 잔반율 정보 찾기
                Float leftoverRate = leftoverRates.stream()
                    .filter(rate -> rate.getMenuName().equals(menu.getMenuName()))
                    .map(MenuLeftoverRate::getLeftoverRate)
                    .findFirst()
                    .orElse(0.0f); 
                
                return MenuLeftoverDto.builder()
                    .menuName(menu.getMenuName())
                    .category(menu.getCategory())
                    .leftoverRate(leftoverRate)
                    .build();
            })
            .collect(Collectors.toList());
        
        // 카테고리 우선순위에 따라 필터링
        List<MenuLeftoverDto> filteredLeftovers = filterMenusByCategory(menuLeftovers);
        
        // 응답 DTO 생성
        LeftoverResponseDto responseDto = LeftoverResponseDto.builder()
            .menuLeftovers(filteredLeftovers)
            .build();
            
        // SSE로 해당 학교의 잔반율 정보 전송
        emitters.forEach((id, emitter) -> {
            try {
                emitter.send(SseEmitter.event()
                        .name("leftover-update")
                        .data(filteredLeftovers));
                log.info("학교 {} - 잔반율 SSE 이벤트 전송 성공: {}", school.getSchoolName(), id);
            } catch (IOException e) {
                log.error("SSE 전송 실패: {}", e.getMessage());
                emitters.remove(id);
            }
        });
        
        return responseDto;
    }
    
    /**
     * 카테고리 우선순위에 따라 메뉴 필터링
     */
    private List<MenuLeftoverDto> filterMenusByCategory(List<MenuLeftoverDto> menuLeftovers) {
        // 메뉴를 카테고리 우선순위에 따라 정렬된 리스트로 변환
        List<MenuLeftoverDto> sortedMenus = new ArrayList<>();
        
        // 1. rice 카테고리 먼저 추가
        sortedMenus.addAll(menuLeftovers.stream()
            .filter(menu -> "rice".equals(menu.getCategory()))
            .collect(Collectors.toList()));
            
        // 2. soup 카테고리 추가
        sortedMenus.addAll(menuLeftovers.stream()
            .filter(menu -> "soup".equals(menu.getCategory()))
            .collect(Collectors.toList()));
            
        // 3. main 카테고리 추가
        sortedMenus.addAll(menuLeftovers.stream()
            .filter(menu -> "main".equals(menu.getCategory()))
            .collect(Collectors.toList()));
            
        // 4. side 카테고리 추가 (최대 개수 제한)
        int remainingSlots = MAX_MENU_COUNT - sortedMenus.size();
        if (remainingSlots > 0) {
            sortedMenus.addAll(menuLeftovers.stream()
                .filter(menu -> "side".equals(menu.getCategory()))
                .limit(remainingSlots)
                .collect(Collectors.toList()));
        }
        
        return sortedMenus;
    }
}