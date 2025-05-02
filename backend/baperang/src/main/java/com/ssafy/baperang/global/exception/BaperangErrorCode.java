package com.ssafy.baperang.global.exception;

import lombok.AllArgsConstructor;
import lombok.Getter;

/**
 * 커스텀 에러코드를 위한 enum
 */

@Getter
@AllArgsConstructor
public enum BaperangErrorCode {

    // Auth 관련 에러 (400-499)
    INVALID_LOGIN_VALUE(400, "C001", "잘못된 로그인 정보입니다."),
    USER_NOT_FOUND(404, "C002", "존재하지 않는 사용자입니다."),
    PASSWORD_NOT_MATCH(400, "C003", "비밀번호가 일치하지 않습니다."),
    DUPLICATE_USER(409, "C004", "이미 존재하는 사용자입니다."),
    INVALID_NICKNAME_LENGTH(400, "N002", "닉네임은 2자 이상 10자 이하로 입력해주세요."),
    UNAUTHORIZED_ACCESS(401, "C005", "인증되지 않은 접근입니다."),

    // Token 관련 에러 (400-499)
    REFRESH_TOKEN_NOT_FOUND(401, "T001", "리프레시 토큰이 없습니다."),
    INVALID_REFRESH_TOKEN(401, "T002", "유효하지 않은 리프레시 토큰입니다."),
    TOKEN_EXPIRED(401, "T003", "만료된 토큰입니다."),
    INVALID_TOKEN(401, "T004", "유효하지 않은 토큰입니다."),

    // 검증 관련 에러 (400-499)
    INVALID_INPUT_VALUE(400, "V001", "잘못된 입력값입니다."),

    // 서버 에러 (500-599)
    INTERNAL_SERVER_ERROR(500, "S001", "서버 내부 오류가 발생했습니다."),

    // 닉네임 관련 에러 (400-499)
    DUPLICATE_NICKNAME(409, "N001", "이미 사용 중인 닉네임입니다."),

    // 권한 관련 에러 (400-499)
    INVALID_ACCESS(403, "A001", "접근 권한이 없습니다."),

    // 스토리 관련 에러
    STORY_NOT_FOUND(404, "ST001", "존재하지 않는 스토리입니다."),
    STORY_CREATE_FAILED(500, "ST002", "스토리 생성에 실패했습니다."),
    STORY_UPDATE_FAILED(500, "ST003", "스토리 업데이트에 실패했습니다."),
    STORY_DELETE_FAILED(500, "ST004", "스토리 삭제에 실패했습니다."),

    // 스토리 장소 관련 에러
    PLACE_NOT_FOUND(404, "PL001", "존재하지 않는 장소입니다."),

    // 스토리 테마 관련 에러
    THEME_NOT_FOUND(404, "TH001", "존재하지 않는 테마입니다."),

   //이미지 관련 에러
   IMAGE_UPLOAD_FAILED(500,"I001","이미지 업로드에 실패샜습니다"),

    // 친구 관련 에러
    FRIEND_NOT_FOUND(404, "F001", "존재하지 않는 친구 요청입니다."),
    DUPLICATE_FRIEND_REQUEST(409, "F002", "이미 친구 요청을 보냈거나 친구 상태입니다."),
    INVALID_FRIEND_STATUS(400, "F003", "유효하지 않은 친구 상태입니다."),
    FRIEND_REQUEST_ALREADY_PROCESSED(400, "F004", "이미 처리된 친구 요청입니다."),
    NOT_FRIEND_USER(400, "F005", "친구가 아닌 유저입니다."),
    FRIEND_STATUS_REQUIRED(400, "F006", "친구 상태를 입력해주세요."),

    // WebSocket 관련 에러
    SOCKET_CONNECTION_ERROR(500, "WS001", "웹소켓 연결 중 오류가 발생했습니다."),
    ROOM_JOIN_ERROR(400, "WS002", "방 참여 중 오류가 발생했습니다."),
    ROOM_LEAVE_ERROR(400, "WS003", "방 나가기 중 오류가 발생했습니다."),
    ROOM_CREATION_ERROR(400, "WS004", "방 생성 중 오류가 발생했습니다."),

    // 알림 관련 에러
    NOTIFICATION_NOT_FOUND(404, "N001", "알림을 찾을 수 없습니다."),
    NOTIFICATION_SEND_FAILED(500, "N002", "알림 전송에 실패했습니다."),
    NOTIFICATION_ALREADY_READ(400, "N003", "이미 읽은 알림입니다."),
    NOTIFICATION_ALREADY_DELETED(400, "N004", "이미 삭제된 알림입니다."),

    // AI 서버 관련 에러
    AI_IMAGE_PROCESSING_ERROR(500, "AI001", "이미지 처리 중 오류가 발생했습니다."),
    AI_SERVER_ERROR(500, "AI002", "AI 서버와 통신 중 오류가 발생했습니다."),
    AI_SERVER_CONNECTION_ERROR(500, "AI003", "AI 서버 연결 오류가 발생했습니다."),
    AI_SERVER_RESPONSE_ERROR(500, "AI004", "AI 서버 응답 처리 중 오류가 발생했습니다."),

    // 웹소켓/멀티 스토리 관련 에러
    WEBSOCKET_INVALID_USER(400, "WS101", "유효하지 않은 사용자 ID입니다."),
    WEBSOCKET_ROOM_NOT_FOUND(404, "WS102", "존재하지 않는 방입니다."),
    WEBSOCKET_ROOM_FULL(409, "WS103", "방이 가득 찼습니다."),
    WEBSOCKET_USER_ALREADY_IN_ROOM(409, "WS104", "사용자가 이미 방에 참여 중입니다."),
    WEBSOCKET_INVALID_ROOM_ID(400, "WS106", "유효하지 않은 방 ID입니다."),
    WEBSOCKET_INVITE_FAILED(400, "WS107", "초대에 실패했습니다."),
    WEBSOCKET_GAME_ALREADY_STARTED(409, "WS109", "게임이 이미 시작되었습니다."),
    WEBSOCKET_GAME_NOT_STARTED(400, "WS110", "게임이 아직 시작되지 않았습니다."),
    WEBSOCKET_INVITATION_NOT_ACCEPTED(403, "WS111", "초대가 수락되지 않았습니다."),
    INVITATION_ACCEPT_ERROR(400, "WS112", "초대 수락 처리 중 오류가 발생했습니다."),
    WEBSOCKET_CHARACTER_NOT_OWNED(403, "WS113", "선택한 캐릭터를 소유하고 있지 않습니다."),
    WEBSOCKET_PAGE_TURN_FAILED(400, "WS114", "페이지 전환 처리 중 오류가 발생했습니다."),
    WEBSOCKET_NOT_HOST(403, "WS108", "방장만 이 작업을 수행할 수 있습니다."),
    WEBSOCKET_USER_NOT_IN_ROOM(400, "WS105", "사용자가 방에 참여하지 않았습니다."),
    WEBSOCKET_ROOM_NOT_JOINABLE(409, "WS115", "방에 참여할 수 없는 상태입니다."),
    WEBSOCKET_CHARACTER_NOT_SELECTED(400, "WS116", "모든 참여자가 캐릭터를 선택해야 합니다."),

    // 작업 큐 관련 에러
    QUEUE_TIMEOUT(408, "Q001", "작업 큐 처리 중 타임아웃이 발생했습니다.");

    private final int status;
    private final String code;
    private final String message;
}
