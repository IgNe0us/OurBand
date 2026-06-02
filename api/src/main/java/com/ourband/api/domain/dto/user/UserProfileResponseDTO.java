package com.ourband.api.domain.dto.user;

import lombok.Builder;
import lombok.Getter;

import java.math.BigDecimal;
import java.util.List;

@Getter
@Builder
public class UserProfileResponseDTO {
    // 1. 기본 유저 정보 (users 테이블)
    private Long userId;
    private String nickname;
    private String handle; // @아이디
    private String type; // admin, user 등
    
    
    // 2. 프로필 정보 (profile 테이블)
    private Integer level;
    private BigDecimal potential; // 음악력
    private String location;  // 활동구역
    private String instrument; // 포지션
    private String bio;
    private String profilePictureUrl;
    private String coverImageUrl;
    
    // 3. 카운트 정보 (follows, bands 테이블 집계)
    private int followerCount;
    private int followingCount;
    private int bandCount; // 소속 밴드 수 (참여 잼 수)
    
    // 5. 로그인 유저와의 관계
    @com.fasterxml.jackson.annotation.JsonProperty("isFollowing")
    private boolean isFollowing;
    
    // 4. 리스트 데이터 (별도 테이블들)
    private List<BandSimpleDTO> bands;        // 소속 밴드 목록
    private List<MusicSimpleDTO> favoriteMusics; // 좋아하는 곡
    private List<HistoryResponse> histories;    // 히스토리 내역
    private List<GearSimpleDTO> gears;           // 장비 목록
}