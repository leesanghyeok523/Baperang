package com.ssafy.baperang.global.exception;

import lombok.Getter;

@Getter
public class PictoryCustomException extends RuntimeException {

    /**
     * enum은 new로 객체생성 필요 x
     * PictoryErrorCode enum에 정의된 errorcode에 대한 message, code, status 사용
     */
    private final PictoryErrorCode errorCode;

    public PictoryCustomException(PictoryErrorCode errorCode) {
        super(errorCode.getMessage());
        this.errorCode = errorCode;
    }
}
