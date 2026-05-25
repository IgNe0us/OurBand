package com.ourband.api.exception;

import lombok.Getter;
import lombok.Setter;

/**
 * 전역 HTTP 응답을 위한 예외 응답 구조체.
 * 클라이언트에게 일관된 에러 메시지를 제공합니다.
 */
@Getter
@Setter
public class ErrorResponse {
    private int status;
    private String message;
    private String errorCode;
}