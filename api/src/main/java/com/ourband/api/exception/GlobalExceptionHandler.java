package com.ourband.api.exception;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.servlet.mvc.method.annotation.ResponseEntityExceptionHandler;

/**
 * 컨트롤러 레이어에서 발생하는 모든 예외를 중앙에서 처리하는 핸들러.
 * 모든 HTTP 응답의 일관성을 유지하는 것이 목적입니다.
 */
@ControllerAdvice
public class GlobalExceptionHandler extends ResponseEntityExceptionHandler {

    // --------------------------------------------------------------------
    // 1. 커스텀 비즈니스 예외 처리
    // --------------------------------------------------------------------

    @ExceptionHandler(DuplicateEmailException.class)
    public ResponseEntity<ErrorResponse> handleDuplicateEmailException(DuplicateEmailException ex) {
        ErrorResponse errorResponse = new ErrorResponse();
        errorResponse.setStatus(HttpStatus.CONFLICT.value()); // 409 Conflict
        errorResponse.setMessage("이미 존재하는 리소스입니다.");
        errorResponse.setErrorCode("DUPLICATE_RESOURCE");
        return new ResponseEntity<>(errorResponse, HttpStatus.CONFLICT);
    }

    @ExceptionHandler(UserNotFoundException.class)
    public ResponseEntity<ErrorResponse> handleUserNotFoundException(UserNotFoundException ex) {
        ErrorResponse errorResponse = new ErrorResponse();
        errorResponse.setStatus(HttpStatus.NOT_FOUND.value()); // 404 Not Found
        errorResponse.setMessage("요청하신 사용자를 찾을 수 없습니다.");
        errorResponse.setErrorCode("USER_NOT_FOUND");
        return new ResponseEntity<>(errorResponse, HttpStatus.NOT_FOUND);
    }

    // --------------------------------------------------------------------
    // 2. Spring 표준 예외 처리 (Validation 등)
    // --------------------------------------------------------------------

    @ExceptionHandler(jakarta.validation.ValidationException.class)
    public ResponseEntity<ErrorResponse> handleValidationException(jakarta.validation.ValidationException ex) {
        ErrorResponse errorResponse = new ErrorResponse();
        errorResponse.setStatus(HttpStatus.BAD_REQUEST.value()); // 400 Bad Request
        errorResponse.setMessage("요청 데이터의 유효성 검사에 실패했습니다. 요청 파라미터를 확인하세요.");
        errorResponse.setErrorCode("VALIDATION_FAILED");
        return new ResponseEntity<>(errorResponse, HttpStatus.BAD_REQUEST);
    }
}
