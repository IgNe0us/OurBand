package com.ourband.api.domain.dto.user;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class HistoryResponse {
    private Long id;
    private String title;      // 히스토리 제목 (예: 홍대 첫 라이브)
    private String content;    // 히스토리 내용 (예: 떨렸지만 좋았습니다.)
    private String mediaUrl;   // 💡 R2 업로드 후 발급받은 실제 파일 주소 URL
    private String mediaType;  // 미디어 타입 (예: "VIDEO" 또는 "IMAGE")
    private Integer viewCount;
    private Integer likeCount;
    private Integer commentCount;
    private Integer shareCount;
    private Boolean likedByMe; // 💡 로그인한 유저가 좋아요를 눌렀는지 여부 추가
    private String authorNickname;   // 💡 글 작성자 닉네임
    private String authorProfilePic;  // 💡 글 작성자 프로필 사진 주소
}
