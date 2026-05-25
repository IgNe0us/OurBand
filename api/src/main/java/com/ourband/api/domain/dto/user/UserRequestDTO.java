package com.ourband.api.domain.dto.user;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

/**
 * 사용자 회원가입 및 프로필 업데이트 요청에 사용되는 DTO.
 * 클라이언트로부터 전달받는 모든 요청 바디(Body)를 담습니다.
 */
@Getter
@Setter
public class UserRequestDTO {

    @NotBlank(message = "닉네임은 필수입니다.")
    private String nickname;

    @NotBlank(message = "이메일은 필수입니다.")
    @Email
    private String email;

    @NotBlank(message = "비밀번호는 필수입니다.")
    private String password;

    @NotBlank(message = "계정 유형은 필수입니다.")
    private String type; // "user" 또는 "business"

    // users 테이블로 들어갈 사업자 번호 (일반 유저는 null)
    private String businessNumber;

    // profile 테이블로 들어갈 주 악기 포지션 (사업자는 null)
    private String instrument;

    /** 프로필 설명 (Bio) */
    // private String bio;

    /** 프로필 이미지 URL */
    // private String profilePictureUrl;

    // 기본 생성자 및 빌더 패턴 등을 추가하는 것이 일반적입니다.
}