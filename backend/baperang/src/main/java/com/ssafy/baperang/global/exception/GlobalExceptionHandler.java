package com.ssafy.baperang.global.exception;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authorization.AuthorizationDeniedException;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.context.request.async.AsyncRequestTimeoutException;

import jakarta.validation.ValidationException;

@ControllerAdvice
public class GlobalExceptionHandler {
    private final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    /**
     * 글로벌 exception handler
     * 핸들하고자 하는 에러에 대한 핸들링 코드를 작성하면 됨
     */

    // 커스텀 예외 처리
    @ExceptionHandler(BaperangCustomException.class)
    public ResponseEntity<ErrorResponse> handleBaperangCustomException(BaperangCustomException ex) {
        BaperangErrorCode errorCode = ex.getErrorCode();
        ErrorResponse response = ErrorResponse.of(errorCode);
        log.error("커스텀 예외 발생: {}", ex.getMessage());
        return ResponseEntity.status(errorCode.getStatus()).body(response);
    }

    // 인증 관련 예외 처리
    @ExceptionHandler({BadCredentialsException.class, UsernameNotFoundException.class})
    public ResponseEntity<ErrorResponse> handleAuthenticationException(Exception ex) {
        BaperangErrorCode errorCode = BaperangErrorCode.INVALID_LOGIN_VALUE;
        ErrorResponse response = ErrorResponse.of(errorCode);
        log.error("인증 예외 발생: {}", ex.getMessage());
        return ResponseEntity.status(errorCode.getStatus()).body(response);
    }

    // IllegalArgumentException, IllegalStateException 처리
    @ExceptionHandler({IllegalArgumentException.class, IllegalStateException.class})
    public ResponseEntity<ErrorResponse> handleIllegalException(Exception ex) {
        BaperangErrorCode errorCode = BaperangErrorCode.INVALID_INPUT_VALUE;
        ErrorResponse response = ErrorResponse.of(errorCode);
        log.error("입력값 예외 발생: {}", ex.getMessage());
        return ResponseEntity.status(errorCode.getStatus()).body(response);
    }
    
    // 요청 데이터 검증 실패 예외 처리
    @ExceptionHandler({MethodArgumentNotValidException.class, ValidationException.class})
    public ResponseEntity<ErrorResponse> handleValidationException(Exception ex) {
        ErrorResponse response = ErrorResponse.of(BaperangErrorCode.INVALID_INPUT_VALUE);
        log.error("검증 예외 발생: {}", ex.getMessage());
        return ResponseEntity.status(400).body(response);
    }

    // 권한 관련 예외 처리
    @ExceptionHandler({AuthorizationDeniedException.class, AccessDeniedException.class})
    public ResponseEntity<ErrorResponse> handleAuthorizationException(Exception ex) {
        ErrorResponse response = ErrorResponse.of(BaperangErrorCode.INVALID_ACCESS);
        log.error("권한 예외 발생: {}", ex.getMessage());
        return ResponseEntity.status(403).body(response);
    }

    // SSE 응답을 위한 예외 처리
    @ExceptionHandler(AsyncRequestTimeoutException.class)
    public ResponseEntity<String> handleAsyncRequestTimeoutException(AsyncRequestTimeoutException ex) {
        ErrorResponse errorResponse = ErrorResponse.of(BaperangErrorCode.QUEUE_TIMEOUT);
        String sseResponse = String.format("data: {\"status\":%d,\"code\":\"%s\",\"message\":\"%s\"}\n\n",
                errorResponse.getStatus(),
                errorResponse.getCode(),
                errorResponse.getMessage());
        
        return ResponseEntity.ok()
                .contentType(MediaType.TEXT_EVENT_STREAM)
                .body(sseResponse);
    }

    // 기타 예외 처리
    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorResponse> handleException(Exception ex) {
        ErrorResponse response = ErrorResponse.of(BaperangErrorCode.INTERNAL_SERVER_ERROR);
        log.error("서버 예외 발생: {}", ex.getMessage(), ex);
        return ResponseEntity.status(500).body(response);
    }
}
