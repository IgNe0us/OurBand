package com.ourband.api.exception;

/**
 * 요청된 리소스(여기서는 User)를 찾을 수 없을 때 발생하는 비즈니스 예외.
 */
public class UserNotFoundException extends RuntimeException {
    public UserNotFoundException(String message) {
        super(message);
    }
}