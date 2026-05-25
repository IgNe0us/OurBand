package com.ourband.api.exception;

/**
 * 이메일 중복 시 발생하는 비즈니스 예외.
 */
public class DuplicateEmailException extends RuntimeException {
    public DuplicateEmailException(String message) {
        super(message);
    }
}