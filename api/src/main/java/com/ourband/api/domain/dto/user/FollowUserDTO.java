package com.ourband.api.domain.dto.user;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
@AllArgsConstructor
public class FollowUserDTO {
    private Long userId;
    private String nickname;
    private String profilePictureUrl;
    private String bio;
    private String instrument;
    private boolean isFollowing; // 내(로그인 유저)가 이 사람을 팔로우하고 있는지 여부
}
