package com.ourband.api.domain.dto.user;

import java.time.LocalDateTime;

public record HistoryCommentResponse(
    Long id,
    Long userId,
    String author, // 💡 DB에는 없지만 프론트에 필요한 유저 닉네임
    String profilePictureUrl,
    String content,
    LocalDateTime createdAt
) {}